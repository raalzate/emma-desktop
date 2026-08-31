/**
 * Pruebas del adaptador de métricas de sesión sobre store-client. Fake en
 * memoria de window.emmaAPI (mismo enfoque que srs-repository.test.ts).
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { EmmaApi } from "@/types/emma-api";
import type { SessionMetrics } from "@/domain/progression/session-metrics";
import { createSessionMetricsRepository } from "../session-metrics-repository";

/** Fake mínimo de window.emmaAPI: solo storeGet/storeSet, respaldados en memoria. */
function createFakeApi(initial: Record<string, unknown> = {}): EmmaApi {
  const memory: Record<string, unknown> = { ...initial };
  return {
    storeGet: async (key: string) => (memory[key] as Record<string, unknown>) ?? {},
    storeSet: async (key: string, value: Record<string, unknown>) => {
      memory[key] = value;
      return { ok: true };
    },
  } as unknown as EmmaApi;
}

const sample: SessionMetrics = {
  responseLatencySeconds: 4,
  longestMonologueWords: 12,
  errorDensityPer100Words: 8,
  turns: 5,
  at: 1_000,
};

describe("createSessionMetricsRepository", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it("devuelve arreglo vacío cuando no hay métricas guardadas", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createSessionMetricsRepository();
    const metrics = await repo.load();

    expect(metrics).toEqual([]);
  });

  it("agrega y recupera las métricas de la sesión", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createSessionMetricsRepository();
    await repo.append(sample);
    const metrics = await repo.load();

    expect(metrics).toEqual([sample]);
  });

  it("acumula varias métricas en orden de inserción", async () => {
    Object.defineProperty(globalThis, "window", {
      value: { emmaAPI: createFakeApi() },
      writable: true,
      configurable: true,
    });

    const repo = createSessionMetricsRepository();
    await repo.append(sample);
    await repo.append({ ...sample, at: 2_000 });
    const metrics = await repo.load();

    expect(metrics.map((m) => m.at)).toEqual([1_000, 2_000]);
  });

  it("descarta entradas corruptas al cargar (guard clause)", async () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        emmaAPI: createFakeApi({
          sessionMetrics: { default: [sample, { turns: "no-numero" }, "no-es-un-objeto"] },
        }),
      },
      writable: true,
      configurable: true,
    });

    const repo = createSessionMetricsRepository();
    const metrics = await repo.load();

    expect(metrics).toEqual([sample]);
  });

  it("devuelve arreglo vacío fuera de Electron (sin window)", async () => {
    const repo = createSessionMetricsRepository();
    const metrics = await repo.load();

    expect(metrics).toEqual([]);
  });
});
