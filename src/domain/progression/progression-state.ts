/** Estado de progresión CEFR por usuario. */

/** Estado persistido: nivel actual + aprobados consecutivos acumulados. */
export interface ProgressionState {
  userId: number;
  level: string;
  streak: number;
}
