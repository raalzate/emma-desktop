/**
 * "Hoy" como días enteros desde epoch: la unidad de tiempo del dominio
 * Leitner (que no conoce `Date`). Único lugar del renderer que lo calcula.
 */

const MS_PER_DAY = 86_400_000;

export function todayAsDays(): number {
  return Math.floor(Date.now() / MS_PER_DAY);
}
