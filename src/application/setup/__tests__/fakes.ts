/** Fakes compartidos de las pruebas del chequeo de setup (sin timers reales). */
import type { ISetupCheckRepository } from "@/domain/setup/i-setup-check-repository";
import type { ISetupProbe } from "@/domain/setup/i-setup-probe";
import type { SetupCheckRecord } from "@/domain/setup/setup-check-record";
import type { AiProbe, MicProbe, VoiceProbe } from "@/domain/setup/setup-probe-result";
import type { SetupClock } from "../run-setup-check-use-case";

export const VOZ_OK: VoiceProbe = { status: "ok", ms: 800, engine: "native" };
export const IA_OK: AiProbe = {
  status: "ok", ms: 2000, mode: "local", online: true, readiness: "ok", localModelAvailable: true,
};
export const MIC_OK: MicProbe = { status: "granted", devices: 1 };

/** Promesa que nunca se resuelve: una sonda colgada. */
export const colgada = <T>(): Promise<T> => new Promise<T>(() => {});

export interface RelojFalso extends SetupClock {
  /** Dispara los temporizadores pendientes cuyo tope sea `ms`. */
  disparar(ms: number): void;
  pendientes(): number[];
}

export function relojFalso(ahora = 1000): RelojFalso {
  const pendientes: { ms: number; fin: () => void }[] = [];
  return {
    now: () => ahora,
    sleep(ms, signal) {
      return new Promise<void>((resolve) => {
        const entrada = { ms, fin: resolve };
        pendientes.push(entrada);
        signal?.addEventListener("abort", () => {
          const i = pendientes.indexOf(entrada);
          if (i >= 0) pendientes.splice(i, 1);
          resolve();
        });
      });
    },
    disparar(ms) {
      for (const p of pendientes.filter((x) => x.ms === ms)) {
        pendientes.splice(pendientes.indexOf(p), 1);
        p.fin();
      }
    },
    pendientes: () => pendientes.map((p) => p.ms),
  };
}

export function sondaFalsa(over: Partial<ISetupProbe> = {}): ISetupProbe {
  return {
    probeVoice: async () => VOZ_OK,
    probeAi: async () => IA_OK,
    probeMic: async () => MIC_OK,
    ...over,
  };
}

export interface RepoFalso extends ISetupCheckRepository {
  registros: SetupCheckRecord[];
}

export function repoFalso(inicial: SetupCheckRecord[] = []): RepoFalso {
  const registros = [...inicial];
  return {
    registros,
    last: async () => registros[registros.length - 1] ?? null,
    history: async () => [...registros].reverse(),
    append: async (r) => { registros.push(r); },
    acknowledgeLast: async () => {
      const i = registros.length - 1;
      if (i < 0) return null;
      registros[i] = { ...registros[i], acknowledged: true };
      return registros[i];
    },
  };
}
