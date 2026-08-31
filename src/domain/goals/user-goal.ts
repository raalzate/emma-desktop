/** Entidad de dominio UserGoal. */

import { GOAL_CATALOG } from "./goal-catalog";

/** Una meta de aprendizaje seleccionada por un usuario. */
export interface UserGoal {
  userId: number;
  goalName: string;
  priorityWeight: number;
  /** Timestamp ISO-8601 UTC (no vacío). */
  createdAt: string;
}

/** Construye un UserGoal validando invariantes (como el __post_init__ original). */
export function createUserGoal(
  userId: number,
  goalName: string,
  priorityWeight: number,
  createdAt: string,
): UserGoal {
  if (!(goalName in GOAL_CATALOG)) {
    throw new Error(`Unknown goal_name: '${goalName}'`);
  }
  const expected = GOAL_CATALOG[goalName];
  if (priorityWeight !== expected) {
    throw new Error(
      `priority_weight ${priorityWeight} does not match ` +
        `catalog weight ${expected} for '${goalName}'`,
    );
  }
  if (!createdAt) {
    throw new Error("created_at must be a non-empty ISO-8601 string");
  }
  return { userId, goalName, priorityWeight, createdAt };
}
