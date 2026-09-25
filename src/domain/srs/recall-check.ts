/**
 * Recuerdo activo en el repaso SRS: para tarjetas de producción el aprendiz
 * escribe la respuesta y el dominio la compara (en vez de sólo "mostrar y
 * autoevaluar"). También calcula cuándo vuelve la tarjeta y resume la sesión.
 */

import { normalizeAnswer } from "@/domain/exercises/evaluate-exercise";
import { isNearTypo } from "@/domain/exercises/answer-diagnosis";
import { BOX_INTERVALS_DAYS, reviewCard, type LeitnerBox } from "./leitner";
import type { SrsCard, SrsCardKind } from "./srs-card";

export type RecallVerdict = "correct" | "near" | "wrong";

export function checkRecall(card: Pick<SrsCard, "back">, typed: string): RecallVerdict {
  const expected = normalizeAnswer(card.back);
  const given = normalizeAnswer(typed);
  if (expected === given) return "correct";
  return isNearTypo(expected, given) ? "near" : "wrong";
}

/** Tipos de tarjeta que se escriben; los de sonido se practican en voz alta. */
export function isTypedRecall(kind: SrsCardKind): boolean {
  return kind === "sentence-production" || kind === "chunk-cloze" || kind === "collocation";
}

export function nextReviewInDays(card: Pick<SrsCard, "box" | "id" | "lastReviewedDay">, correct: boolean): number {
  const next = reviewCard(card, correct, card.lastReviewedDay);
  return BOX_INTERVALS_DAYS[next.box as LeitnerBox];
}

export interface ReviewResult {
  cardId: string;
  correct: boolean;
  fromBox: LeitnerBox;
}

export interface ReviewSummary {
  reviewed: number;
  correct: number;
  /** Subieron de caja (sin contar las que ya estaban en la última). */
  promoted: number;
  /** Volvieron a la caja 1. */
  reset: number;
  /** Acertadas en la caja 5: ya dominadas. */
  mastered: number;
  messageEs: string;
}

const LAST_BOX: LeitnerBox = 5;

function reviewMessage(summary: Omit<ReviewSummary, "messageEs">): string {
  if (summary.reviewed === 0) return "Nada que repasar hoy.";
  if (summary.reset === 0) return "Todo en su sitio: ninguna tarjeta volvió al inicio.";
  if (summary.correct >= summary.reviewed / 2) {
    return `${summary.reset} tarjeta(s) vuelven a la caja 1: mañana las ves de nuevo.`;
  }
  return "Día difícil. Las tarjetas que fallaste vuelven mañana; el repaso corto y diario es lo que las fija.";
}

export function summarizeReview(results: readonly ReviewResult[]): ReviewSummary {
  const base = {
    reviewed: results.length,
    correct: results.filter((r) => r.correct).length,
    promoted: results.filter((r) => r.correct && r.fromBox < LAST_BOX).length,
    reset: results.filter((r) => !r.correct).length,
    mastered: results.filter((r) => r.correct && r.fromBox === LAST_BOX).length,
  };
  return { ...base, messageEs: reviewMessage(base) };
}
