/**
 * Bus de fallos en vivo (FR-034): la voz o la IA fallan durante la práctica y la
 * UI sugiere abrir el chequeo. Mismo patrón que `emma:xp-awarded`: un evento de
 * ventana, sin store global. Reportar es best-effort: nunca rompe el turno.
 */

import type { LiveFailure } from "@/domain/setup/live-failure";
import { CHAT_FALLBACK } from "@/application/chat/run-chat-turn-use-case";

export const SETUP_ISSUE = "emma:setup-issue";

const defaultTarget = (): EventTarget | undefined => (typeof window !== "undefined" ? window : undefined);

export function reportLiveFailure(failure: LiveFailure, target: EventTarget | undefined = defaultTarget()): void {
  target?.dispatchEvent(new CustomEvent<LiveFailure>(SETUP_ISSUE, { detail: failure }));
}

/** Suscribe un manejador; devuelve la función que desuscribe. */
export function onLiveFailure(
  handler: (failure: LiveFailure) => void,
  target: EventTarget | undefined = defaultTarget(),
): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<LiveFailure>).detail);
  target?.addEventListener(SETUP_ISSUE, listener);
  return () => target?.removeEventListener(SETUP_ISSUE, listener);
}

const isAbort = (error: unknown): boolean => error instanceof Error && error.name === "AbortError";

function safely(report: (f: LiveFailure) => void, failure: LiveFailure): void {
  try {
    report(failure);
  } catch {
    // El aviso es accesorio: un oyente roto no debe tumbar el turno.
  }
}

/**
 * Observa un turno de chat sin alterarlo: un error del LLM (no cancelación) o la
 * degradación al mensaje de respaldo se reportan; la respuesta o el error siguen igual.
 */
export async function watchChatTurn(
  run: () => Promise<string>,
  report: (failure: LiveFailure) => void = reportLiveFailure,
): Promise<string> {
  try {
    const reply = await run();
    if (reply === CHAT_FALLBACK) safely(report, { kind: "ai-timeout" });
    return reply;
  } catch (error) {
    if (!isAbort(error)) safely(report, { kind: "ai-error" });
    throw error;
  }
}
