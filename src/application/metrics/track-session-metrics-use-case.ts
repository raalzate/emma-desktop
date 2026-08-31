/**
 * Caso de uso: calcula las métricas de progreso de una sesión terminada y las
 * persiste (trackSessionMetrics), y resume la tendencia reciente para la UI
 * (getMetricsTrend). El repo se inyecta (puerto ISessionMetricsRepository);
 * un fallo de persistencia nunca debe romper el cierre de sesión ni la vista
 * de progreso, así que ambas funciones tragan el error y devuelven un
 * resultado neutro (documentado, no un accidente).
 */

import type { ISessionMetricsRepository } from "@/domain/progression/i-session-metrics-repository";
import { computeSessionMetrics, type SessionMetrics } from "@/domain/progression/session-metrics";
import type { ChatTurn } from "@/domain/chat/simulation-session";
import type { SilentError } from "@/domain/chat/silent-error";

type AverageMetrics = Omit<SessionMetrics, "turns" | "at">;

const ZERO_AVERAGES: AverageMetrics = {
  responseLatencySeconds: 0,
  longestMonologueWords: 0,
  errorDensityPer100Words: 0,
};

/** Calcula y persiste las métricas de una sesión; no lanza si el repo falla. */
export async function trackSessionMetrics({
  repo,
  messages,
  errors,
  at,
}: {
  repo: ISessionMetricsRepository;
  messages: ChatTurn[];
  errors: SilentError[];
  at: number;
}): Promise<void> {
  const metrics = computeSessionMetrics({ messages, errors, at });
  try {
    await repo.append(metrics);
  } catch (err) {
    console.error("No se pudieron guardar las métricas de la sesión", err);
  }
}

/** Promedio de una métrica sobre un arreglo (0 si está vacío). */
function average(entries: SessionMetrics[], pick: (m: SessionMetrics) => number): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, m) => sum + pick(m), 0) / entries.length;
}

/** Últimas `last` métricas guardadas y su promedio por métrica; vacío si el repo falla. */
export async function getMetricsTrend({
  repo,
  last,
}: {
  repo: ISessionMetricsRepository;
  last: number;
}): Promise<{ entries: SessionMetrics[]; averages: AverageMetrics }> {
  let all: SessionMetrics[] = [];
  try {
    all = await repo.load();
  } catch (err) {
    console.error("No se pudieron leer las métricas de la sesión", err);
    return { entries: [], averages: ZERO_AVERAGES };
  }

  const entries = all.slice(-last);
  return {
    entries,
    averages: {
      responseLatencySeconds: average(entries, (m) => m.responseLatencySeconds),
      longestMonologueWords: average(entries, (m) => m.longestMonologueWords),
      errorDensityPer100Words: average(entries, (m) => m.errorDensityPer100Words),
    },
  };
}
