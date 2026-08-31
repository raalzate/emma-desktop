/**
 * Pruebas de trackSessionMetrics/getMetricsTrend con un repo fake en memoria
 * (puerto ISessionMetricsRepository inyectado, sin mockear imports).
 */

import { describe, it, expect } from "vitest";
import type { ISessionMetricsRepository } from "@/domain/progression/i-session-metrics-repository";
import type { SessionMetrics } from "@/domain/progression/session-metrics";
import type { ChatTurn } from "@/domain/chat/simulation-session";
import type { SilentError } from "@/domain/chat/silent-error";
import { trackSessionMetrics, getMetricsTrend } from "../track-session-metrics-use-case";

/** Repo fake en memoria: mismo contrato que el adaptador real. */
function createFakeRepo(initial: SessionMetrics[] = []): ISessionMetricsRepository {
  const memory: SessionMetrics[] = [...initial];
  return {
    load: async () => [...memory],
    append: async (m) => {
      memory.push(m);
    },
  };
}

/** Repo fake que siempre falla, para probar tolerancia a errores. */
function createFailingRepo(): ISessionMetricsRepository {
  return {
    load: async () => {
      throw new Error("disco no disponible");
    },
    append: async () => {
      throw new Error("disco no disponible");
    },
  };
}

const messages: ChatTurn[] = [
  { role: "assistant", content: "Hi there", at: 0 },
  { role: "user", content: "Hello, I am ready", at: 2_000 },
];
const errors: SilentError[] = [];

describe("trackSessionMetrics", () => {
  it("calcula y persiste las métricas de la sesión", async () => {
    const repo = createFakeRepo();

    await trackSessionMetrics({ repo, messages, errors, at: 100 });
    const stored = await repo.load();

    expect(stored).toHaveLength(1);
    expect(stored[0].turns).toBe(1);
    expect(stored[0].at).toBe(100);
  });

  it("no lanza si el repo falla al persistir", async () => {
    const repo = createFailingRepo();

    await expect(
      trackSessionMetrics({ repo, messages, errors, at: 100 }),
    ).resolves.not.toThrow();
  });
});

describe("getMetricsTrend", () => {
  it("devuelve las últimas N métricas y su promedio por métrica", async () => {
    const stored: SessionMetrics[] = [
      { responseLatencySeconds: 2, longestMonologueWords: 4, errorDensityPer100Words: 10, turns: 3, at: 1 },
      { responseLatencySeconds: 4, longestMonologueWords: 8, errorDensityPer100Words: 20, turns: 5, at: 2 },
      { responseLatencySeconds: 6, longestMonologueWords: 12, errorDensityPer100Words: 30, turns: 7, at: 3 },
    ];
    const repo = createFakeRepo(stored);

    const trend = await getMetricsTrend({ repo, last: 2 });

    expect(trend.entries).toEqual(stored.slice(-2));
    expect(trend.averages.responseLatencySeconds).toBe(5); // (4+6)/2
    expect(trend.averages.longestMonologueWords).toBe(10); // (8+12)/2
    expect(trend.averages.errorDensityPer100Words).toBe(25); // (20+30)/2
  });

  it("devuelve vacío y promedios en cero cuando el repo falla", async () => {
    const repo = createFailingRepo();

    const trend = await getMetricsTrend({ repo, last: 3 });

    expect(trend.entries).toEqual([]);
    expect(trend.averages).toEqual({
      responseLatencySeconds: 0,
      longestMonologueWords: 0,
      errorDensityPer100Words: 0,
    });
  });

  it("devuelve vacío cuando no hay métricas guardadas", async () => {
    const repo = createFakeRepo();

    const trend = await getMetricsTrend({ repo, last: 5 });

    expect(trend.entries).toEqual([]);
    expect(trend.averages.responseLatencySeconds).toBe(0);
  });
});
