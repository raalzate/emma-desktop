import { describe, it, expect } from "vitest";
import {
  SETUP_CHECK_VERSION, SETUP_HISTORY_MAX, appendHistory, canContinue, recordMeasurements, requiresFirstRunCheck,
  type SetupCheckRecord,
} from "../setup-check-record";
import type { SetupDiagnosis } from "../diagnose-setup";
import type { ISetupCheckRepository } from "../i-setup-check-repository";
import type { ISetupProbe } from "../i-setup-probe";

const diag = (verdict: SetupDiagnosis["verdict"]): SetupDiagnosis => ({ verdict, probes: [] });
const rec = (over: Partial<SetupCheckRecord> = {}): SetupCheckRecord => ({
  version: SETUP_CHECK_VERSION, at: 1, trigger: "first-run", diagnosis: diag("pass"), acknowledged: false, ...over,
});

describe("requiresFirstRunCheck", () => {
  it("nunca bloquea a quien ya completó el onboarding", () => {
    expect(requiresFirstRunCheck({ onboardingCompleted: true, last: null })).toBe(false);
    expect(requiresFirstRunCheck({ onboardingCompleted: true, last: rec({ diagnosis: diag("blocked") }) })).toBe(false);
  });

  it("exige chequeo si no hay registro", () => {
    expect(requiresFirstRunCheck({ onboardingCompleted: false, last: null })).toBe(true);
  });

  it("no vuelve a exigirlo con un registro verde vigente", () => {
    expect(requiresFirstRunCheck({ onboardingCompleted: false, last: rec() })).toBe(false);
  });

  it("lo exige si la versión del registro es vieja", () => {
    expect(requiresFirstRunCheck({ onboardingCompleted: false, last: rec({ version: SETUP_CHECK_VERSION - 1 }) })).toBe(true);
  });

  it("lo exige si el último fue bloqueado, aunque esté reconocido", () => {
    const last = rec({ diagnosis: diag("blocked"), acknowledged: true });
    expect(requiresFirstRunCheck({ onboardingCompleted: false, last })).toBe(true);
  });

  it("con advertencias lo exige hasta que se reconoce", () => {
    const warn = rec({ diagnosis: diag("warn") });
    expect(requiresFirstRunCheck({ onboardingCompleted: false, last: warn })).toBe(true);
    expect(requiresFirstRunCheck({ onboardingCompleted: false, last: { ...warn, acknowledged: true } })).toBe(false);
  });
});

describe("appendHistory", () => {
  it("pone el registro más nuevo primero sin mutar la entrada", () => {
    const h = [rec({ at: 1 })];
    const out = appendHistory(h, rec({ at: 2 }));
    expect(out.map((r) => r.at)).toEqual([2, 1]);
    expect(h).toHaveLength(1);
  });

  it("conserva como máximo 20 y descarta los más viejos", () => {
    let h: SetupCheckRecord[] = [];
    for (let i = 1; i <= SETUP_HISTORY_MAX + 5; i++) h = appendHistory(h, rec({ at: i }));
    expect(SETUP_HISTORY_MAX).toBe(20);
    expect(h).toHaveLength(20);
    expect(h[0].at).toBe(25);
    expect(h[19].at).toBe(6);
  });
});

describe("canContinue", () => {
  it.each([
    ["pass", true],
    ["warn", true],
    ["blocked", false],
  ] as const)("veredicto %s ⇒ %s", (v, esperado) => {
    expect(canContinue(diag(v))).toBe(esperado);
  });
});

describe("puertos del chequeo", () => {
  it("se pueden implementar con fakes en memoria", async () => {
    const probe: ISetupProbe = {
      probeVoice: async () => ({ status: "ok", ms: 1, engine: "native" }),
      probeAi: async () => ({ status: "ok", ms: 1, mode: "local", online: true, readiness: "ok", localModelAvailable: true }),
      probeMic: async () => ({ status: "granted", devices: 1 }),
    };
    let store: SetupCheckRecord[] = [];
    const repo: ISetupCheckRepository = {
      last: async () => store[0] ?? null,
      history: async () => store,
      append: async (r) => {
        store = appendHistory(store, r);
      },
      acknowledgeLast: async () => {
        if (!store[0]) return null;
        store = [{ ...store[0], acknowledged: true }, ...store.slice(1)];
        return store[0];
      },
    };
    await repo.append(rec({ at: 7 }));
    expect((await repo.last())?.at).toBe(7);
    expect((await probe.probeMic(new AbortController().signal)).devices).toBe(1);
  });
});

describe("recordMeasurements", () => {
  it("conserva sólo motor de voz y modo/readiness/online/carga de la IA, con la carga entera", () => {
    const r = recordMeasurements({
      voice: { status: "ok", engine: "native", ms: 900, detail: "texto" },
      ai: {
        status: "ok", ms: 100, loadMs: 8356.4, mode: "hybrid", online: false, readiness: "ok",
        localModelAvailable: true, detail: "prompt?",
      },
    });
    expect(r).toEqual({ voiceEngine: "native", ai: { mode: "hybrid", readiness: "ok", online: false, loadMs: 8356 } });
  });

  it("omite lo que no se midió y la carga si no hubo", () => {
    expect(recordMeasurements({})).toEqual({});
    const r = recordMeasurements({
      ai: { status: "ok", mode: "local", online: true, readiness: "ok", localModelAvailable: true },
    });
    expect(r).toEqual({ ai: { mode: "local", readiness: "ok", online: true } });
  });
});
