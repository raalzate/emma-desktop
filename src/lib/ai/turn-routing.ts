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

/** Las llamadas que forman el turno de práctica (ver los tags del puerto). */
export const TURN_TAGS: ReadonlySet<string> = new Set(["chat", "chat-retry", "observe"]);

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
 * Turno en la nube con respaldo local (FR-003 de #348): sin red, sin llave o con
 * un error del proveedor, la conversación no se corta — el turno se genera en
 * el equipo. Una cancelación (el turno venció su tope) no se reintenta.
 */
export async function withCloudFallback(
  remote: () => Promise<string>,
  local: () => Promise<string>,
  signal?: AbortSignal,
): Promise<string> {
  if (signal?.aborted) throw abortError();
  try {
    const out = await remote();
    if (signal?.aborted) throw abortError();
    return out;
  } catch (err) {
    if (signal?.aborted || (err instanceof Error && err.name === "AbortError")) throw err;
    return local();
  }
}
