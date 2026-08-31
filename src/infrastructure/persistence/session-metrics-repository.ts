/**
 * Repositorio de métricas de progreso por sesión sobre el almacén JSON.
 *
 * Mismo patrón que srs-repository.ts: guard clauses mínimas al cargar (sin
 * Zod, por consistencia con los demás repos de esta carpeta) que descartan
 * entradas corruptas en vez de lanzar, ya que el origen es disco local.
 */

import type { ISessionMetricsRepository } from "@/domain/progression/i-session-metrics-repository";
import type { SessionMetrics } from "@/domain/progression/session-metrics";
import { readOne, writeOne } from "./store-client";

const KEY = "sessionMetrics";

/** Valida el shape mínimo de una métrica de sesión leída de disco. */
function isValidSessionMetrics(value: unknown): value is SessionMetrics {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.responseLatencySeconds === "number" &&
    typeof m.longestMonologueWords === "number" &&
    typeof m.errorDensityPer100Words === "number" &&
    typeof m.turns === "number" &&
    typeof m.at === "number"
  );
}

export function createSessionMetricsRepository(): ISessionMetricsRepository {
  return {
    async load() {
      const stored = await readOne<unknown[]>(KEY);
      if (!Array.isArray(stored)) return [];
      return stored.filter(isValidSessionMetrics);
    },
    async append(m) {
      const stored = (await readOne<SessionMetrics[]>(KEY)) ?? [];
      const current = Array.isArray(stored) ? stored.filter(isValidSessionMetrics) : [];
      await writeOne(KEY, [...current, m]);
    },
  };
}
