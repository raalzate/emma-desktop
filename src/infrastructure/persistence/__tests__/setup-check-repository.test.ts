import { afterEach, describe, expect, it } from "vitest";
import type { EmmaApi } from "@/types/emma-api";
import { SETUP_CHECK_VERSION, SETUP_HISTORY_MAX, type SetupCheckRecord } from "@/domain/setup/setup-check-record";
import { createSetupCheckRepository } from "../setup-check-repository";

function useFakeApi(initial: Record<string, unknown> = {}): Record<string, unknown> {
  const memory: Record<string, unknown> = { ...initial };
  const api = {
    storeGet: async (key: string) => (memory[key] as Record<string, unknown>) ?? {},
    storeSet: async (key: string, value: Record<string, unknown>) => {
      memory[key] = value;
      return { ok: true };
    },
  } as unknown as EmmaApi;
  Object.defineProperty(globalThis, "window", { value: { emmaAPI: api }, writable: true, configurable: true });
  return memory;
}

const record = (at: number, acknowledged = false): SetupCheckRecord => ({
  version: SETUP_CHECK_VERSION,
  at,
  trigger: "settings",
  diagnosis: { verdict: "pass", probes: [] },
  acknowledged,
});

describe("createSetupCheckRepository", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", { value: undefined, writable: true, configurable: true });
  });

  it("sin datos: last null e historial vacío", async () => {
    useFakeApi();
    const repo = createSetupCheckRepository();
    expect(await repo.last()).toBeNull();
    expect(await repo.history()).toEqual([]);
  });

  it("append deja el más nuevo primero", async () => {
    useFakeApi();
    const repo = createSetupCheckRepository();
    await repo.append(record(1));
    await repo.append(record(2));
    expect((await repo.history()).map((r) => r.at)).toEqual([2, 1]);
    expect((await repo.last())?.at).toBe(2);
  });

  it("respeta el tope de historial", async () => {
    useFakeApi();
    const repo = createSetupCheckRepository();
    for (let i = 0; i < SETUP_HISTORY_MAX + 5; i++) await repo.append(record(i));
    const h = await repo.history();
    expect(h).toHaveLength(SETUP_HISTORY_MAX);
    expect(h[0].at).toBe(SETUP_HISTORY_MAX + 4);
  });

  it("acknowledgeLast marca el último en su lugar sin sumar entradas", async () => {
    useFakeApi();
    const repo = createSetupCheckRepository();
    await repo.append(record(1));
    await repo.append(record(2));
    const r = await repo.acknowledgeLast();
    expect(r?.at).toBe(2);
    expect(r?.acknowledged).toBe(true);
    const h = await repo.history();
    expect(h).toHaveLength(2);
    expect(h[0].acknowledged).toBe(true);
    expect(h[1].acknowledged).toBe(false);
  });

  it("acknowledgeLast devuelve null sin registros", async () => {
    useFakeApi();
    expect(await createSetupCheckRepository().acknowledgeLast()).toBeNull();
  });

  it("descarta registros corruptos al leer", async () => {
    useFakeApi({ setupChecks: { default: { records: [record(5), { basura: true }, null, 3] } } });
    const h = await createSetupCheckRepository().history();
    expect(h.map((r) => r.at)).toEqual([5]);
  });
});
