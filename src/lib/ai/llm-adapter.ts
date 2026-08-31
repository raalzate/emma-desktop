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
import { getSelectedLitertModelFile } from "@/lib/litert-models";
import { localAvailable, remoteAvailable, remoteGenerateText } from "./providers";
import { loadAiSettings, modelFor, type AiMode } from "./remote-settings";

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
    onToken
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
  return async (args) => {
    const { prompt, system, onToken } = args;
    const mode = modeOverride ?? loadAiSettings().mode;

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
        if (!remoteAvailable()) throw err;
      }
    }
    if (remoteAvailable()) return (await runRemoteTurn(system, prompt)).trim();
    throw new Error("No hay IA disponible (ni local ni remota).");
  };
}
