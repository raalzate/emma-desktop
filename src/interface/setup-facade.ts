/**
 * Fachada del chequeo de setup para la UI: ata los casos de uso a los puertos
 * (sonda, repositorio, reloj, SO). La UI sólo ve `run / needsFirstRun / acknowledge`.
 */

import { acknowledgeSetupCheck } from "@/application/setup/acknowledge-setup-check-use-case";
import { needsFirstRunCheck } from "@/application/setup/first-run-gate-use-case";
import { runSetupCheck, type SetupClock } from "@/application/setup/run-setup-check-use-case";
import type { SetupDiagnosis } from "@/domain/setup/diagnose-setup";
import type { ISetupCheckRepository } from "@/domain/setup/i-setup-check-repository";
import type { ISetupProbe } from "@/domain/setup/i-setup-probe";
import type { SetupCheckRecord } from "@/domain/setup/setup-check-record";
import type { OsName } from "@/domain/setup/setup-remediation";
import type { ProbeName } from "@/domain/setup/setup-probe-result";

export interface SetupFacade {
  run(a: { trigger: SetupCheckRecord["trigger"]; only?: ProbeName }): Promise<SetupDiagnosis>;
  needsFirstRun(onboardingCompleted: boolean): Promise<boolean>;
  acknowledge(): Promise<SetupCheckRecord | null>;
  last(): Promise<SetupCheckRecord | null>;
  history(): Promise<SetupCheckRecord[]>;
}

export interface SetupFacadeDeps {
  probe: ISetupProbe;
  repo: ISetupCheckRepository;
  clock: SetupClock;
  os: () => OsName;
}

export function createSetupFacade(deps: SetupFacadeDeps): SetupFacade {
  return {
    run: ({ trigger, only }) =>
      runSetupCheck({ probe: deps.probe, repo: deps.repo, clock: deps.clock, os: deps.os(), trigger, only }),
    needsFirstRun: (onboardingCompleted) => needsFirstRunCheck({ repo: deps.repo, onboardingCompleted }),
    acknowledge: () => acknowledgeSetupCheck({ repo: deps.repo }),
    last: () => deps.repo.last(),
    history: () => deps.repo.history(),
  };
}

/** Reloj real: `sleep` resuelve también al abortar y libera su temporizador. */
export function createSetupClock(): SetupClock {
  return {
    now: () => Date.now(),
    sleep: (ms, signal) =>
      new Promise<void>((resolve) => {
        if (signal?.aborted) return resolve();
        const done = () => {
          clearTimeout(timer);
          signal?.removeEventListener("abort", done);
          resolve();
        };
        const timer = setTimeout(done, ms);
        signal?.addEventListener("abort", done, { once: true });
      }),
  };
}

/** SO a partir de `navigator.platform`; lo desconocido cae en linux (pasos genéricos). */
export function detectOs(platform: string): OsName {
  const p = platform.toLowerCase();
  if (p.includes("mac")) return "mac";
  if (p.includes("win")) return "windows";
  return "linux";
}

export const currentOs = (): OsName => detectOs(typeof navigator !== "undefined" ? navigator.platform : "");
