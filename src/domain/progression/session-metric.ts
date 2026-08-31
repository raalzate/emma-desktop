/** Métrica de una sesión de simulación (base para el veredicto de progresión). */
export interface SessionMetric {
  /** Turnos del usuario en la sesión. */
  turns: number;
  /** Errores silenciosos capturados en la sesión. */
  errors: number;
}

/** Errores por turno (0 si no hubo turnos). */
export function errorsPerTurn(metric: SessionMetric): number {
  return metric.turns > 0 ? metric.errors / metric.turns : 0;
}
