/**
 * Caso de uso de repaso espaciado (0.5 del libro): orquesta el puerto
 * ISrsRepository con la mecánica pura de dominio (dueCards/reviewCard).
 * El puerto se inyecta por argumento, nunca se instancia aquí.
 */

import { dueCards, reviewCard } from "@/domain/srs/leitner";
import type { SrsCard } from "@/domain/srs/srs-card";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";

/** Límite diario de tarjetas por sesión, según el libro (new/day = 15). */
const DEFAULT_SESSION_LIMIT = 15;

/**
 * Carga las tarjetas vencidas del repo, las ordena por caja ascendente
 * (las más frágiles primero) y corta al límite indicado.
 */
export async function startReviewSession({
  repo,
  today,
  limit = DEFAULT_SESSION_LIMIT,
}: {
  repo: ISrsRepository;
  today: number;
  limit?: number;
}): Promise<SrsCard[]> {
  const cards = await repo.loadCards();
  const due = dueCards(cards, today) as SrsCard[];
  const sorted = [...due].sort((a, b) => a.box - b.box);
  return sorted.slice(0, limit);
}

/** Aplica el resultado de un repaso y persiste la tarjeta actualizada. */
export async function answerCard({
  repo,
  cardId,
  correct,
  today,
}: {
  repo: ISrsRepository;
  cardId: string;
  correct: boolean;
  today: number;
}): Promise<SrsCard> {
  const cards = await repo.loadCards();
  const target = cards.find((c) => c.id === cardId);
  if (!target) {
    throw new Error(`No existe la tarjeta con id "${cardId}"`);
  }

  const updated = reviewCard(target, correct, today) as SrsCard;
  const next = cards.map((c) => (c.id === cardId ? updated : c));
  await repo.saveCards(next);
  return updated;
}

/** Añade tarjetas nuevas al repo sin duplicar por id; devuelve cuántas se añadieron. */
export async function addCards({
  repo,
  cards,
}: {
  repo: ISrsRepository;
  cards: SrsCard[];
}): Promise<number> {
  const existing = await repo.loadCards();
  const existingIds = new Set(existing.map((c) => c.id));
  const toAdd = cards.filter((c) => !existingIds.has(c.id));

  await repo.saveCards([...existing, ...toAdd]);
  return toAdd.length;
}
