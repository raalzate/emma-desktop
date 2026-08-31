/**
 * Repositorio de metas sobre el almacén JSON. El puerto IGoalRepository es SÍNCRONO
 * (como el ABC original), así que se hidrata en memoria al construir (async) y las
 * escrituras persisten en segundo plano (fire-and-forget) manteniendo la memoria
 * como fuente de verdad de lectura.
 */

import type { IGoalRepository } from "@/domain/goals/i-goal-repository";
import type { UserGoal } from "@/domain/goals/user-goal";
import { readOne, writeOne } from "./store-client";

const KEY = "goals";

/** Carga inicial de metas (llamar antes de construir el repo). */
export async function loadGoals(): Promise<UserGoal[]> {
  return (await readOne<UserGoal[]>(KEY)) ?? [];
}

export function createGoalRepository(initial: UserGoal[]): IGoalRepository {
  let goals = [...initial];
  return {
    replaceGoals(_userId, next) {
      goals = [...next].sort((a, b) => b.priorityWeight - a.priorityWeight);
      void writeOne(KEY, goals);
    },
    getGoals(_userId) {
      return [...goals].sort((a, b) => b.priorityWeight - a.priorityWeight);
    },
  };
}
