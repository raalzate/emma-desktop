/**
 * Convierte los ítems fallados de un ejercicio cerrado en tarjetas SRS y las
 * persiste sin duplicar (id estable por ejercicio+ítem). Cierra el bucle
 * practice → repaso del método: lo que fallas hoy vuelve mañana.
 */

import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { UnitExercise } from "@/domain/exercises/exercise";
import { buildCardsFromExerciseMisses } from "@/domain/srs/srs-card";
import { addCards } from "./review-session-use-case";

export async function captureExerciseMisses({
  repo,
  exercise,
  failedIndexes,
  today,
}: {
  repo: ISrsRepository;
  exercise: UnitExercise;
  failedIndexes: readonly number[];
  today: number;
}): Promise<number> {
  const cards = buildCardsFromExerciseMisses(exercise, failedIndexes, today);
  return addCards({ repo, cards });
}
