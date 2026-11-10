import { describe, it, expect } from "vitest";
import { AI_MS, PROBE_TIMEOUT_MS, VOICE_MS, classifyLatency } from "../setup-thresholds";

describe("umbrales de latencia del chequeo", () => {
  it("fija los valores iniciales de Q3", () => {
    expect(VOICE_MS).toEqual({ ok: 2000, slow: 5000 });
    expect(AI_MS).toEqual({ ok: 5000, slow: 15000 });
    expect(PROBE_TIMEOUT_MS).toEqual({ voice: 10000, ai: 20000, mic: 5000 });
  });

  it.each([
    [0, "ok"],
    [1999, "ok"],
    [2000, "slow"],
    [4999, "slow"],
    [5000, "very-slow"],
    [60000, "very-slow"],
  ] as const)("voz %i ms es %s", (ms, esperado) => {
    expect(classifyLatency(ms, VOICE_MS)).toBe(esperado);
  });

  it.each([
    [4999, "ok"],
    [5000, "slow"],
    [14999, "slow"],
    [15000, "very-slow"],
  ] as const)("IA %i ms es %s", (ms, esperado) => {
    expect(classifyLatency(ms, AI_MS)).toBe(esperado);
  });

  it("los topes de espera superan el umbral de muy lenta", () => {
    expect(PROBE_TIMEOUT_MS.voice).toBeGreaterThanOrEqual(VOICE_MS.slow);
    expect(PROBE_TIMEOUT_MS.ai).toBeGreaterThanOrEqual(AI_MS.slow);
  });

  it("peor caso total <= 30 s (SC-003): voz y micrófono en paralelo, luego la IA", () => {
    const peorCaso = Math.max(PROBE_TIMEOUT_MS.voice, PROBE_TIMEOUT_MS.mic) + PROBE_TIMEOUT_MS.ai;
    expect(peorCaso).toBeLessThanOrEqual(30000);
  });
});
