/** Fallos en vivo (FR-034): voz o IA fallan durante la práctica y se sugiere el chequeo. */
import type { SetupCause } from "./setup-remediation";

export type LiveFailure = { kind: "voice-fallback" } | { kind: "ai-error" } | { kind: "ai-timeout" };

const SUGGEST_EVERY_MS = 10 * 60 * 1000;

export function causeOfLiveFailure(f: LiveFailure): SetupCause {
  switch (f.kind) {
    case "voice-fallback":
      return "voice-fallback";
    case "ai-error":
      return "ai-no-response";
    case "ai-timeout":
      return "ai-timeout";
  }
}

/** Una sugerencia cada 10 min como máximo, para no spamear en cada burbuja. */
export function shouldSuggestCheck(a: { lastSuggestedAt?: number; now: number }): boolean {
  if (a.lastSuggestedAt === undefined) return true;
  return a.now - a.lastSuggestedAt >= SUGGEST_EVERY_MS;
}
