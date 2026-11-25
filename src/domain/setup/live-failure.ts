/** Fallos en vivo (FR-034): voz o IA fallan durante la práctica y se sugiere el chequeo. */
import type { SetupCause } from "./setup-remediation";

export type LiveFailure =
  | { kind: "voice-fallback" }
  | { kind: "ai-error" }
  | { kind: "ai-timeout" }
  /** La conversación es lenta en este equipo (T18 de #323): se sugiere la nube. */
  | { kind: "ai-slow" };

const SUGGEST_EVERY_MS = 10 * 60 * 1000;

export function causeOfLiveFailure(f: LiveFailure): SetupCause {
  switch (f.kind) {
    case "voice-fallback":
      return "voice-fallback";
    case "ai-error":
      return "ai-no-response";
    case "ai-timeout":
      return "ai-timeout";
    case "ai-slow":
      return "ai-slow-local";
  }
}

/** Una sugerencia cada 10 min como máximo, para no spamear en cada burbuja. */
export function shouldSuggestCheck(a: { lastSuggestedAt?: number; now: number }): boolean {
  if (a.lastSuggestedAt === undefined) return true;
  return a.now - a.lastSuggestedAt >= SUGGEST_EVERY_MS;
}

/**
 * Umbral de turno lento (T18 de #323): el doble de la meta de respuesta
 * completa (SC-002, 4 s). Más allá, la conversación se siente rota y conviene
 * ofrecer la nube; por debajo, sugerirla en cada sesión sería insistir de más.
 */
export const SLOW_TURN_MS = 8000;
const SLOW_WINDOW = 3;

/** ¿Los últimos 3 turnos tienen mediana por encima del umbral? */
export function isSlowConversation(turnMs: readonly number[]): boolean {
  const recent = turnMs.slice(-SLOW_WINDOW);
  if (recent.length < SLOW_WINDOW) return false;
  const median = [...recent].sort((a, b) => a - b)[Math.floor(SLOW_WINDOW / 2)];
  return median > SLOW_TURN_MS;
}
