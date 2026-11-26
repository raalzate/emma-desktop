/**
 * Adaptador router → puerto `LlmGenerate` del dominio.
 *
 * Los casos de uso del dominio dependen SOLO de `LlmGenerate` (src/domain/ai/llm-port).
 * Aquí lo implementamos sobre los motores reales: Gemma local (LiteRT-LM/WebGPU en
 * el renderer) y, opcionalmente, la nube. EMMA es local-first:
 *   - mode "local"  → siempre Gemma local (streaming).
 *   - mode "remote" → siempre el proveedor de nube elegido.
 *   - mode "hybrid" → local primero; si el local no está disponible o falla, nube.
 */

import type { LlmGenerate, LlmGenerateArgs } from "@/domain/ai/llm-port";
import { litertGenerate } from "./litert-engine";
import { isAbortError } from "./generation-queue";
import { getSelectedLitertModelFile } from "@/lib/litert-models";
import { localAvailable, remoteAvailable, remoteGenerateText } from "./providers";
import { loadAiSettings, modelFor, type AiMode } from "./remote-settings";
import { globalTraceBuffer, maybeTrace } from "./llm-trace";
import { enforcedMaxTokens } from "./output-budget";
import { HEDGE_AFTER_MS, hedgedTurn, routeFor } from "./turn-routing";

/**
 * Ejecuta un turno en el modelo local (Gemma) con streaming opcional.
 *
 * SIN memoria incremental (BUG-001): el encadenado por KV-cache de LiteRT perdía
 * los turnos previos y la persona "olvidaba" la conversación. El caso de uso
 * reconstruye el contexto completo en `prompt` en cada turno; aquí solo se
 * ejecuta system + prompt en una conversación fresca.
 */
async function runLocalTurn(
  args: LlmGenerateArgs,
  onToken?: (c: string) => void
): Promise<string> {
  return litertGenerate(
    getSelectedLitertModelFile(),
    [
      ...(args.system ? [{ role: "system" as const, content: args.system }] : []),
      { role: "user" as const, content: args.prompt },
    ],
    onToken,
    { priority: args.priority, signal: args.signal, maxTokens: enforcedMaxTokens(args.tag, args.maxTokens) }
  );
}

/** Ejecuta un turno en la nube (sin streaming en esta versión). */
async function runRemoteTurn(system: string | undefined, prompt: string): Promise<string> {
  const settings = loadAiSettings();
  const model = modelFor(settings, settings.provider);
  return remoteGenerateText(settings.provider, model, prompt, system);
}

/** Construye un LlmGenerate que respeta el modo global de IA. */
export function createLlmGenerate(modeOverride?: AiMode): LlmGenerate {
  // Traza de diagnóstico (T3 de #323): en dev siempre, en producción con flag.
  return maybeTrace(createRoutedLlm(modeOverride));
}

function createRoutedLlm(modeOverride?: AiMode): LlmGenerate {
  return async (args) => {
    const { prompt, system, onToken } = args;
    const settings = loadAiSettings();
    const mode = modeOverride ?? settings.mode;

    // #348: con «respuestas en la nube», sólo el turno de práctica sale del
    // equipo. #353: si la nube tarda o falla, el modelo local corre en carrera.
    if (!modeOverride && mode !== "remote" && routeFor(args.tag, settings) === "remote" && remoteAvailable()) {
      return (
        await hedgedTurn(
          () => runRemoteTurn(system, prompt),
          (signal) => {
            // Diagnóstico (#353): queda en la traza cuándo corrió el respaldo local.
            globalTraceBuffer().push({
              tag: `${args.tag}:hedge-local`,
              startedAt: Date.now(),
              ms: 0,
              promptChars: prompt.length,
              ok: true,
              preview: "",
            });
            // Sin streaming: si al final gana la nube, el texto no parpadea.
            return runLocalTurn({ ...args, signal }, undefined);
          },
          { hedgeAfterMs: HEDGE_AFTER_MS, signal: args.signal },
        )
      ).trim();
    }

    // La nube es sin estado: siempre recibe el prompt completo (ignora sessionId).
    if (mode === "remote" && remoteAvailable()) {
      return (await runRemoteTurn(system, prompt)).trim();
    }
    if (mode === "local") {
      return (await runLocalTurn(args, onToken)).trim();
    }
    // hybrid: local primero, nube como red de seguridad.
    if (localAvailable()) {
      try {
        return (await runLocalTurn(args, onToken)).trim();
      } catch (err) {
        // Cancelada o preemptada: no se reintenta en la nube.
        if (isAbortError(err) || !remoteAvailable()) throw err;
      }
    }
    if (remoteAvailable()) return (await runRemoteTurn(system, prompt)).trim();
    throw new Error("No hay IA disponible (ni local ni remota).");
  };
}
