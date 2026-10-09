/**
 * Pruebas del adaptador de gamificación sobre store-client, con un fake en
 * memoria de window.emmaAPI (mismo enfoque que session-metrics-repository.test.ts).
 */

import { afterEach, describe, expect, it } from "vitest";
import type { EmmaApi } from "@/types/emma-api";
import type { XpEvent } from "@/domain/gamification/xp-event";
import { createGamificationRepository, MAX_STORED_EVENTS } from "../gamification-repository";

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

const sample: XpEvent = { kind: "review", xp: 3, day: 100, at: 1 };

describe("createGamificationRepository", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", { value: undefined, writable: true, configurable: true });
  });

  it("devuelve vacío cuando no hay nada guardado", async () => {
    useFakeApi();
    expect(await createGamificationRepository().load()).toEqual([]);
  });

  it("agrega y recupera eventos", async () => {
    useFakeApi();
    const repo = createGamificationRepository();
    await repo.append([sample]);
    await repo.append([{ ...sample, kind: "challenge", xp: 25 }]);
    expect((await repo.load()).map((e) => e.kind)).toEqual(["review", "challenge"]);
  });

  it("descarta entradas corruptas al cargar", async () => {
    useFakeApi({ gamification: { default: { events: [sample, { kind: "x" }, "basura"] } } });
    expect(await createGamificationRepository().load()).toEqual([sample]);
  });

  it("tolera un registro con forma inesperada", async () => {
    useFakeApi({ gamification: { default: "no-es-un-objeto" } });
    expect(await createGamificationRepository().load()).toEqual([]);
  });

  it("conserva sólo los eventos más recientes por encima del tope", async () => {
    const many = Array.from({ length: MAX_STORED_EVENTS }, (_, i) => ({ ...sample, at: i }));
    useFakeApi({ gamification: { default: { events: many } } });
    const repo = createGamificationRepository();
    await repo.append([{ ...sample, at: -1, kind: "lesson", xp: 10 }]);
    const stored = await repo.load();
    expect(stored).toHaveLength(MAX_STORED_EVENTS);
    expect(stored.at(-1)?.kind).toBe("lesson");
  });

  it("fuera de Electron no falla", async () => {
    Object.defineProperty(globalThis, "window", { value: undefined, writable: true, configurable: true });
    const repo = createGamificationRepository();
    await repo.append([sample]);
    expect(await repo.load()).toEqual([]);
  });
});
