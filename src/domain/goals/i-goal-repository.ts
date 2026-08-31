/** Contrato para la persistencia de metas. */

import type { UserGoal } from "./user-goal";

/** Puerto para leer y reemplazar las metas de aprendizaje del usuario. */
export interface IGoalRepository {
  /** Borra todas las metas del usuario e inserta la nueva lista atómicamente. */
  replaceGoals(userId: number, goals: UserGoal[]): void;
  /** Devuelve las metas del usuario ordenadas por priorityWeight descendente. */
  getGoals(userId: number): UserGoal[];
}
