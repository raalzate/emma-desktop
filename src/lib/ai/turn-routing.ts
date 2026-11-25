/**
 * Ruteo del turno de práctica (#348).
 *
 * El "why": con IA local, cada paso del modelo tarda 2–4 s en un equipo como el
 * del banco de #323 y la conversación no baja de 4 s. Pasar TODA la IA a la
 * nube era la única salida. Con `replyInCloud`, sólo el turno (entender el
 * mensaje del aprendiz y la respuesta de Emma) va al proveedor de nube; la
 * gramática, las sugerencias, las lecciones y la voz siguen en el equipo.
 */

import type { AiRemoteSettings } from "./remote-settings";

/**
 * Las llamadas de la conversación de práctica que van a la nube: el turno
 * (chat, chat-retry, observe) y, desde #353, los hechos de la escena —con IA
 * local la escena tardaba ~19 s en quedar lista—. Lo demás sigue local.
 */
export const TURN_TAGS: ReadonlySet<string> = new Set(["chat", "chat-retry", "observe", "scene-facts"]);

export type Route = "local" | "remote";

export function routeFor(tag: string | undefined, settings: Pick<AiRemoteSettings, "mode" | "replyInCloud">): Route {
  if (settings.mode === "remote") return "remote";
  return settings.replyInCloud && tag !== undefined && TURN_TAGS.has(tag) ? "remote" : "local";
}

function abortError(): Error {
  const err = new Error("Generation aborted");
  err.name = "AbortError";
  return err;
}

/**
 * Turno en la nube con respaldo local en carrera (#353). Diagnóstico del banco:
 * la cola (p95 ~12 s) era la nube misma —la capa gratuita tarda 4–6,5 s a
 * veces—, no el respaldo. Si la nube no respondió en `hedgeAfterMs`, se lanza
 * también el modelo local (~3,5 s) y gana el primero en responder bien; el
 * perdedor local se cancela. Si la nube falla, el local responde sin esperar
 * el plazo.
 */
export function hedgedTurn(
  remote: () => Promise<string>,
  local: (signal: AbortSignal) => Promise<string>,
  options: { hedgeAfterMs: number; signal?: AbortSignal },
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const localCtl = new AbortController();
    let settled = false;
    let localStarted = false;
    let remoteFailed = false;
    let localError: unknown = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const win = (value: string, fromRemote: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (fromRemote) localCtl.abort();
      resolve(value);
    };

    const startLocal = () => {
      if (localStarted || settled) return;
      localStarted = true;
      clearTimeout(timer);
      local(localCtl.signal).then(
        (v) => win(v, false),
        (err) => {
          localError = err;
          if (remoteFailed && !settled) {
            settled = true;
            reject(err);
          }
        },
      );
    };

    if (options.signal?.aborted) return reject(abortError());
    options.signal?.addEventListener("abort", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      localCtl.abort();
      reject(abortError());
    });

    timer = setTimeout(startLocal, options.hedgeAfterMs);
    remote().then(
      (v) => win(v, true),
      () => {
        remoteFailed = true;
        if (localError && !settled) {
          settled = true;
          reject(localError);
          return;
        }
        startLocal();
      },
    );
  });
}

/** Plazo antes de lanzar el respaldo local: la nube responde en ~1,0 s de mediana. */
export const HEDGE_AFTER_MS = 1500;
