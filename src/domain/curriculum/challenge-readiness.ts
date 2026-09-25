/**
 * Preparación de una entrega de reto: la rúbrica del libro se autoevalúa
 * criterio a criterio antes de marcar el reto como hecho, y las entregas
 * escritas piden un mínimo de palabras (un reto de output forzado no se
 * cumple con una línea). Dominio puro.
 */

import type { UnitChallenge } from "./unit";

export const MIN_WORDS_WRITTEN = 25;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface ChallengeReadiness {
  ready: boolean;
  words: number;
  missingEs: string[];
}

function needsLongText(mode: UnitChallenge["mode"]): boolean {
  return mode === "written" || mode === "real-work";
}

export function challengeReadiness(
  challenge: UnitChallenge,
  text: string,
  checkedCriteria: readonly number[],
): ChallengeReadiness {
  const words = wordCount(text);
  const missingEs: string[] = [];

  if (needsLongText(challenge.mode) && words < MIN_WORDS_WRITTEN) {
    missingEs.push(`La entrega necesita al menos ${MIN_WORDS_WRITTEN} palabras (llevas ${words}).`);
  } else if (words === 0) {
    missingEs.push("Deja una nota de cómo fue la práctica (aunque sea una línea).");
  }

  const unchecked = challenge.criteria.filter((_, i) => !checkedCriteria.includes(i)).length;
  if (unchecked > 0) {
    missingEs.push(`Marca los ${unchecked} criterio(s) que aún no revisaste en tu entrega.`);
  }

  return { ready: missingEs.length === 0, words, missingEs };
}
