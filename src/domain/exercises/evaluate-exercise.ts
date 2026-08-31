/**
 * Corrección determinista de ejercicios cerrados (el libro trae solucionario
 * en el Apéndice I). Dominio puro: sin IO, solo comparación de texto.
 */

import type { ExerciseItem, UnitExercise } from "./exercise";

/** Apóstrofe tipográfico (’) usado a veces en textos pegados de fuentes. */
const TYPOGRAPHIC_APOSTROPHE = /[’]/g;
/** Puntuación final a ignorar en la comparación (., !, ?). */
const TRAILING_PUNCTUATION = /[.!?]+$/;

/**
 * Normaliza una respuesta para comparación: recorta, minúsculas, colapsa
 * espacios internos, quita puntuación final y unifica apóstrofes.
 */
export function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(TYPOGRAPHIC_APOSTROPHE, "'")
    .replace(TRAILING_PUNCTUATION, "")
    .trim()
    .replace(/\s+/g, " ");
}

/** Compara la respuesta del usuario contra answer y altAnswers normalizados. */
export function evaluateItem(
  item: ExerciseItem,
  userAnswer: string,
): { correct: boolean; expected: string } {
  const expected = normalizeAnswer(item.answer);
  const candidates = [expected, ...(item.altAnswers ?? []).map(normalizeAnswer)];
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  return {
    correct: candidates.includes(normalizedUserAnswer),
    expected,
  };
}

/** Corrige un ejercicio completo; lanza si el número de respuestas no coincide. */
export function gradeExercise(
  exercise: UnitExercise,
  answers: string[],
): { total: number; correct: number; failedIndexes: number[] } {
  if (answers.length !== exercise.items.length) {
    throw new Error(
      `Se esperaban ${exercise.items.length} respuestas, se recibieron ${answers.length}`,
    );
  }

  const failedIndexes: number[] = [];
  let correct = 0;

  exercise.items.forEach((item, index) => {
    const { correct: isCorrect } = evaluateItem(item, answers[index]);
    if (isCorrect) {
      correct += 1;
    } else {
      failedIndexes.push(index);
    }
  });

  return { total: exercise.items.length, correct, failedIndexes };
}
