/**
 * Opciones cerradas para un ítem de ejercicio. El "why": «clasificar» y
 * «elegir» son ejercicios de reconocimiento; obligar a teclear «/ɪd/» o una
 * frase entera convierte el ejercicio en dictado y esconde la consigna. Si el
 * conjunto de respuestas del ejercicio es pequeño, el ítem se responde tocando
 * una opción; si no, se escribe. Dominio puro.
 */

import type { UnitExercise } from "./exercise";

const MAX_OPTIONS = 8;
// La consigna del ejercicio (`promptEs`) es material de estudio en español.
const WRITES_RE = /\bescrib[ei]/i;

/** Respuestas distintas del ejercicio, en orden de aparición. */
function distinctAnswers(exercise: UnitExercise): string[] {
  return Array.from(new Set(exercise.items.map((item) => item.answer)));
}

/**
 * Ejercicio de sílaba fuerte: la respuesta marca la sílaba tónica en
 * mayúsculas («dePLOYment») sobre la misma palabra del stem.
 */
function isStressAnswer(stem: string, answer: string): boolean {
  return (
    /[a-z]/.test(answer) &&
    /[A-Z]{2,}/.test(answer) &&
    answer.toLowerCase() === stem.trim().toLowerCase()
  );
}

/** Sílabas de la respuesta según sus tramos de mayúsculas/minúsculas. */
function syllablesOf(answer: string): string[] {
  return answer.match(/[A-Z]+|[a-z]+/g) ?? [answer];
}

/** Una opción por sílaba: cada una con esa sílaba en mayúsculas. */
function stressOptions(answer: string): string[] {
  const syllables = syllablesOf(answer).map((s) => s.toLowerCase());
  return syllables.map((_, i) =>
    syllables.map((s, j) => (i === j ? s.toUpperCase() : s)).join(""),
  );
}

/**
 * Opciones para el ítem `index`, o null si el ítem se escribe.
 * Para «clasificar»/«elegir» las opciones son las respuestas distintas del
 * ejercicio (2..8); la sílaba fuerte se deriva de la propia palabra.
 */
export function optionsFor(exercise: UnitExercise, index: number): string[] | null {
  if (exercise.kind !== "classify" && exercise.kind !== "choose") return null;
  if (WRITES_RE.test(exercise.promptEs)) return null;
  const item = exercise.items[index];
  if (!item) return null;
  if (isStressAnswer(item.stem, item.answer)) return stressOptions(item.answer);

  const answers = distinctAnswers(exercise);
  if (answers.length < 2 || answers.length > MAX_OPTIONS) return null;
  return answers;
}

/** Una línea que dice cómo se responde este ítem. */
export function describeInteraction(exercise: UnitExercise, index: number): string {
  const options = optionsFor(exercise, index);
  if (options) return "Tap the right option. If you miss, you'll see the answer and why.";
  return "Type the answer in English and press Enter. If you're close, you get a second try.";
}
