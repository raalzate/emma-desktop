/**
 * Sistema Leitner de repetición espaciada (0.5 del libro): mecánicamente
 * idéntico a un algoritmo SRS. Cinco cajas con intervalos crecientes; acertar
 * sube de caja, fallar vuelve a la caja 1. El "día" es un entero inyectado por
 * el llamador (sin Date) para mantener el dominio puro y determinista.
 */

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface LeitnerCard {
  readonly id: string;
  readonly box: LeitnerBox;
  readonly lastReviewedDay: number;
}

/** Días entre repasos por caja: caja 1 a diario, caja 5 cada 16 días. */
export const BOX_INTERVALS_DAYS: Record<LeitnerBox, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
};

const MAX_BOX: LeitnerBox = 5;
const MIN_BOX: LeitnerBox = 1;

/** Aplica el resultado de un repaso: sube de caja (tope 5) o cae a la 1. */
export function reviewCard(card: LeitnerCard, correct: boolean, today: number): LeitnerCard {
  const nextBox = correct
    ? (Math.min(card.box + 1, MAX_BOX) as LeitnerBox)
    : MIN_BOX;
  return { ...card, box: nextBox, lastReviewedDay: today };
}

/** True si ya pasó el intervalo de la caja desde el último repaso. */
export function isDue(card: LeitnerCard, today: number): boolean {
  return today - card.lastReviewedDay >= BOX_INTERVALS_DAYS[card.box];
}

/** Subconjunto de tarjetas vencidas para el día dado. */
export function dueCards(cards: readonly LeitnerCard[], today: number): LeitnerCard[] {
  return cards.filter((card) => isDue(card, today));
}
