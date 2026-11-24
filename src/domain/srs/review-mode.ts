/**
 * Modo del repaso (FR-010): texto (como hoy), audio (sólo dictados) o mixto.
 * `text` excluye `audio-recall`; mientras no existan esas tarjetas equivale a
 * no filtrar, así que el comportamiento por defecto no cambia.
 */

import { dueCards } from "./leitner";
import { isTeachableCard } from "./recall-check";
import type { SrsCard } from "./srs-card";

export type ReviewMode = "text" | "audio" | "mixed";

export function filterByMode<T extends Pick<SrsCard, "kind">>(cards: readonly T[], mode: ReviewMode): T[] {
  if (mode === "mixed") return [...cards];
  return cards.filter((c) => (c.kind === "audio-recall") === (mode === "audio"));
}

export type ModeCounts = Record<ReviewMode, number>;

/**
 * Cuántas tarjetas vencidas hay por modo, sin el tope de la sesión: usa la misma
 * regla de vencimiento, el mismo filtro de modo y el mismo descarte de
 * reformulaciones que la sesión, para que el selector diga la verdad.
 */
export function countDueByMode(cards: readonly SrsCard[], today: number): ModeCounts {
  const due = (dueCards(cards, today) as SrsCard[]).filter(isTeachableCard);
  return {
    text: filterByMode(due, "text").length,
    audio: filterByMode(due, "audio").length,
    mixed: due.length,
  };
}
