import { describe, expect, it, vi } from "vitest";
import { createSetupClock, createSetupFacade, detectOs } from "../setup-facade";
import type { ISetupCheckRepository } from "@/domain/setup/i-setup-check-repository";
import type { ISetupProbe } from "@/domain/setup/i-setup-probe";
import type { SetupCheckRecord } from "@/domain/setup/setup-check-record";

function memoryRepo(): ISetupCheckRepository & { records: SetupCheckRecord[] } {
  const state = { records: [] as SetupCheckRecord[] };
  return {
    get records() { return state.records; },
    last: async () => state.records[0] ?? null,
    history: async () => state.records,
    append: async (r) => void (state.records = [r, ...state.records]),
    acknowledgeLast: async () => {
      if (!state.records[0]) return null;
      state.records[0] = { ...state.records[0], acknowledged: true };
      return state.records[0];
    },
  };
}

const okProbe: ISetupProbe = {
  probeVoice: async () => ({ status: "ok", engine: "native", ms: 300 }),
  probeAi: async () => ({ status: "ok", ms: 800, mode: "local", online: true, readiness: "ok", localModelAvailable: true }),
  probeMic: async () => ({ status: "granted", devices: 1 }),
};

describe("fachada de setup", () => {
  const build = (probe: ISetupProbe = okProbe) => {
    const repo = memoryRepo();
    const facade = createSetupFacade({ probe, repo, clock: { now: () => 777, sleep: () => new Promise(() => {}) }, os: () => "mac" });
    return { repo, facade };
  };

  it("run corre el chequeo, persiste con el trigger y devuelve el diagnóstico", async () => {
    const { repo, facade } = build();
    const diagnosis = await facade.run({ trigger: "settings" });
    expect(diagnosis.verdict).toBe("pass");
    expect(repo.records[0]).toMatchObject({ at: 777, trigger: "settings" });
  });

  it("needsFirstRun: sin chequeo previo y onboarding pendiente ⇒ true; ya completado ⇒ false", async () => {
    const { facade } = build();
    expect(await facade.needsFirstRun(false)).toBe(true);
    expect(await facade.needsFirstRun(true)).toBe(false);
  });

  it("acknowledge marca el último chequeo con advertencias", async () => {
    const { repo, facade } = build({ ...okProbe, probeMic: async () => ({ status: "denied", devices: 1 }) });
    await facade.run({ trigger: "first-run" });
    expect(await facade.acknowledge()).not.toBeNull();
    expect(repo.records[0].acknowledged).toBe(true);
  });

  it("last e history leen del repo", async () => {
    const { facade } = build();
    await facade.run({ trigger: "settings" });
    expect((await facade.last())?.trigger).toBe("settings");
    expect(await facade.history()).toHaveLength(1);
  });
});

describe("detectOs", () => {
  it("mapea la plataforma del navegador", () => {
    expect(detectOs("MacIntel")).toBe("mac");
    expect(detectOs("Win32")).toBe("windows");
    expect(detectOs("Linux x86_64")).toBe("linux");
    expect(detectOs("")).toBe("linux");
  });
});

describe("createSetupClock", () => {
  it("sleep resuelve al vencer el plazo", async () => {
    vi.useFakeTimers();
    const done = vi.fn();
    void createSetupClock().sleep(50).then(done);
    await vi.advanceTimersByTimeAsync(50);
    expect(done).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("sleep resuelve también al abortar la señal y limpia el temporizador", async () => {
    vi.useFakeTimers();
    const ctl = new AbortController();
    const done = vi.fn();
    void createSetupClock().sleep(60_000, ctl.signal).then(done);
    ctl.abort();
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("con la señal ya abortada resuelve de inmediato", async () => {
    const ctl = new AbortController();
    ctl.abort();
    await expect(createSetupClock().sleep(60_000, ctl.signal)).resolves.toBeUndefined();
  });

  it("now devuelve epoch ms", () => {
    expect(createSetupClock().now()).toBeGreaterThan(1_600_000_000_000);
  });
});
