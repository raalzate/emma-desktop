/**
 * Modo del repaso (FR-010): texto (como hoy), audio (sólo dictados) o mixto.
 * `text` excluye `audio-recall`; mientras no existan esas tarjetas equivale a
 * no filtrar, así que el comportamiento por defecto no cambia.
 */

import type { SrsCard } from "./srs-card";

export type ReviewMode = "text" | "audio" | "mixed";

export function filterByMode<T extends Pick<SrsCard, "kind">>(cards: readonly T[], mode: ReviewMode): T[] {
  if (mode === "mixed") return [...cards];
  return cards.filter((c) => (c.kind === "audio-recall") === (mode === "audio"));
}
