/**
 * Selección de retos del libro (paso 7, output forzado): qué retos tiene una
 * unidad, cuál es el siguiente pendiente y el reto que corresponde a la
 * sesión activa (misma unidad que ancla la simulación, vía `unitForSession`).
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { CurriculumUnit, UnitChallenge } from "@/domain/curriculum/unit";
import { getUnit, unitForSession } from "@/domain/curriculum/unit-catalog";
import { ALL_UNITS } from "@/lib/curriculum-data";

export function challengesForUnit(unitNumber: number): UnitChallenge[] {
  return getUnit(unitNumber)?.challenges ?? [];
}

/** Primer reto de la unidad que no aparece en `completed`, o null si no quedan. */
export function nextChallengeForUnit(
  unitNumber: number,
  completed: readonly number[],
): UnitChallenge | null {
  const challenges = challengesForUnit(unitNumber);
  const pending = challenges.find((c) => !completed.includes(c.id));
  return pending ?? null;
}

export interface SessionChallenge {
  unit: CurriculumUnit;
  challenge: UnitChallenge;
}

/**
 * Reto de la unidad que ancla la sesión de simulación (escenario + nivel).
 * Null si el escenario no tiene unidad asociada o ya no quedan retos pendientes.
 */
export function challengeForSession(
  scenarioType: string,
  level: CefrLevel,
  completed: readonly number[],
): SessionChallenge | null {
  const unit = unitForSession(scenarioType, level);
  if (!unit) return null;

  const challenge = nextChallengeForUnit(unit.number, completed);
  if (!challenge) return null;

  return { unit, challenge };
}

/** Progreso global sobre los 72 retos del libro (26 unidades). */
export function challengeProgress(completed: readonly number[]): {
  done: number;
  total: number;
} {
  const total = ALL_UNITS.reduce((sum, u) => sum + u.challenges.length, 0);
  const done = completed.filter((id) =>
    ALL_UNITS.some((u) => u.challenges.some((c) => c.id === id)),
  ).length;
  return { done, total };
}
