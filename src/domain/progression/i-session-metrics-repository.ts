/** Contrato de persistencia para las métricas de progreso por sesión. */

import type { SessionMetrics } from "./session-metrics";

export interface ISessionMetricsRepository {
  load(): Promise<SessionMetrics[]>;
  append(m: SessionMetrics): Promise<void>;
}
