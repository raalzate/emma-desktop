/**
 * Manejador de fallos en vivo (FR-034): aplica el throttle de 10 min de
 * `shouldSuggestCheck` y pide la sugerencia. Nunca lanza: el turno no se toca.
 */
import { causeOfLiveFailure, shouldSuggestCheck, type LiveFailure } from "@/domain/setup/live-failure";
import type { SetupCause } from "@/domain/setup/setup-remediation";
import type { ProbeName } from "@/domain/setup/setup-probe-result";

export interface IssueHandlerDeps {
  now(): number;
  suggest(cause: SetupCause): void;
}

export function createIssueHandler(deps: IssueHandlerDeps): (failure: LiveFailure) => void {
  let lastSuggestedAt: number | undefined;
  return (failure) => {
    const now = deps.now();
    if (!shouldSuggestCheck({ lastSuggestedAt, now })) return;
    lastSuggestedAt = now;
    try {
      deps.suggest(causeOfLiveFailure(failure));
    } catch {
      // El aviso es accesorio.
    }
  };
}

const PROBE_OF_CAUSE: Record<SetupCause, ProbeName> = {
  "no-webgpu": "ai", "low-ram": "ai", "ai-slow-local": "ai", "ai-slow-remote": "ai", "ai-no-response": "ai",
  "ai-empty": "ai", "ai-timeout": "ai", "ai-offline": "ai",
  "voice-fallback": "voice", "voice-slow": "voice", "voice-timeout": "voice",
  "mic-denied": "mic", "mic-missing": "mic",
};

export const probeOfCause = (cause: SetupCause): ProbeName => PROBE_OF_CAUSE[cause];

/** Destino del toast: pestaña de audio y la sonda a repetir. */
export const settingsUrlFor = (cause: SetupCause): string => `/settings/?tab=audio&focus=${probeOfCause(cause)}`;
