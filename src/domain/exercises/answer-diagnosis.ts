/**
 * Diagnóstico pedagógico de una respuesta: además de correcto/incorrecto,
 * distingue el "casi" (tipeo o un hueco de varios) para ofrecer reintento en
 * vez de revelar la clave, y produce pistas graduales. El "why": la
 * corrección binaria enseña poco; el error productivo se aprende cuando el
 * aprendiz llega a la forma correcta por sí mismo. Dominio puro.
 */

import type { ExerciseItem } from "./exercise";
import { normalizeAnswer } from "./evaluate-exercise";

export type AnswerVerdict = "correct" | "near" | "wrong";

export interface SlotVerdict {
  expected: string;
  given: string;
  ok: boolean;
}

export interface AnswerDiagnosis {
  verdict: AnswerVerdict;
  /** Respuesta modelo normalizada. */
  expected: string;
  /** Veredicto por hueco (un solo elemento cuando el stem tiene un hueco). */
  slots: SlotVerdict[];
}

const BLANK = /_{2,}/g;
/** Proporción de la longitud tolerada como tipeo. */
const NEAR_RATIO = 0.2;

function countBlanks(stem: string): number {
  return (stem.match(BLANK) ?? []).length;
}

/**
 * Parte una respuesta en huecos: solo cuando el stem tiene ≥2 huecos y la
 * respuesta trae la misma cantidad de segmentos separados por coma.
 */
export function splitSlots(item: ExerciseItem, text: string): string[] {
  const blanks = countBlanks(item.stem);
  const segments = text.split(",").map((s) => normalizeAnswer(s));
  if (blanks >= 2 && segments.length === blanks) return segments;
  return [normalizeAnswer(text)];
}

/** Distancia de Levenshtein clásica (sin optimizar: las respuestas son cortas). */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

/** True si `given` difiere de `expected` sólo por un tipeo (≤20% de la longitud, mínimo 1). */
export function isNearTypo(expected: string, given: string): boolean {
  if (!given) return false;
  const tolerance = Math.max(1, Math.floor(expected.length * NEAR_RATIO));
  return editDistance(expected, given) <= tolerance;
}

function candidatesOf(item: ExerciseItem): string[] {
  return [item.answer, ...(item.altAnswers ?? [])];
}

function diagnoseAgainst(item: ExerciseItem, candidate: string, given: string): AnswerDiagnosis {
  const expectedSlots = splitSlots(item, candidate);
  const givenSlots = splitSlots(item, given);
  const slots: SlotVerdict[] = expectedSlots.map((expected, i) => {
    const slotGiven = givenSlots[i] ?? "";
    return { expected, given: slotGiven, ok: expected === slotGiven };
  });
  const expected = normalizeAnswer(candidate);
  if (slots.every((s) => s.ok)) return { verdict: "correct", expected, slots };

  const okCount = slots.filter((s) => s.ok).length;
  const nearBySlot = slots.length >= 2 && okCount === slots.length - 1;
  const nearByTypo = slots.length === 1 && isNearTypo(expected, normalizeAnswer(given));
  return { verdict: nearBySlot || nearByTypo ? "near" : "wrong", expected, slots };
}

const RANK: Record<AnswerVerdict, number> = { correct: 2, near: 1, wrong: 0 };

/** Diagnostica contra answer y altAnswers; se queda con el mejor veredicto. */
export function diagnoseAnswer(item: ExerciseItem, userAnswer: string): AnswerDiagnosis {
  const diagnoses = candidatesOf(item).map((c) => diagnoseAgainst(item, c, userAnswer));
  return diagnoses.reduce((best, d) => (RANK[d.verdict] > RANK[best.verdict] ? d : best));
}

export type HintLevel = 0 | 1 | 2;

function maskWord(word: string, level: HintLevel): string {
  if (word.length <= 1) return word;
  // Nivel 2: la mitad de la palabra, nunca menos de dos letras (así "had" → "ha_").
  const shown = level === 1 ? 1 : Math.max(2, Math.floor(word.length / 2));
  return word.slice(0, shown) + "_".repeat(word.length - shown);
}

/**
 * Pista gradual sobre la respuesta modelo: nivel 1 muestra la primera letra
 * de cada palabra (y cuántas hay); nivel 2, la mitad inicial de cada una.
 */
export function hintFor(answer: string, level: HintLevel): string {
  if (level === 0) return "";
  return normalizeAnswer(answer)
    .split(" ")
    .map((w) => maskWord(w, level))
    .join(" ");
}
