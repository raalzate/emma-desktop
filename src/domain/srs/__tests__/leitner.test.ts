import { describe, it, expect } from "vitest";
import { reviewCard, isDue, dueCards, type LeitnerCard } from "../leitner";

const card = (
  box: LeitnerCard["box"],
  lastReviewedDay: number,
  id = "c1",
): LeitnerCard => ({
  id,
  box,
  lastReviewedDay,
});

describe("reviewCard", () => {
  it("sube una caja al acertar", () => {
    const result = reviewCard(card(1, 0), true, 1);
    expect(result.box).toBe(2);
    expect(result.lastReviewedDay).toBe(1);
  });

  it("no sube más allá de la caja 5 al acertar", () => {
    const result = reviewCard(card(5, 0), true, 16);
    expect(result.box).toBe(5);
  });

  it("vuelve a la caja 1 al fallar, sin importar la caja actual", () => {
    const result = reviewCard(card(4, 8), false, 9);
    expect(result.box).toBe(1);
    expect(result.lastReviewedDay).toBe(9);
  });

  it("no muta la tarjeta original", () => {
    const original = card(1, 0);
    reviewCard(original, true, 1);
    expect(original.box).toBe(1);
  });
});

describe("isDue", () => {
  it("la caja 1 vence cada 1 día", () => {
    expect(isDue(card(1, 5), 6)).toBe(true);
    expect(isDue(card(1, 5), 5)).toBe(false);
  });

  it("la caja 3 vence cada 4 días", () => {
    expect(isDue(card(3, 10), 14)).toBe(true);
    expect(isDue(card(3, 10), 13)).toBe(false);
  });

  it("la caja 5 vence cada 16 días", () => {
    expect(isDue(card(5, 0), 16)).toBe(true);
    expect(isDue(card(5, 0), 15)).toBe(false);
  });
});

describe("dueCards", () => {
  it("filtra solo las tarjetas vencidas para el día dado", () => {
    const cards = [card(1, 0, "c1"), card(3, 0, "c3"), card(5, 0, "c5")];
    expect(dueCards(cards, 1).map((c) => c.id)).toEqual(["c1"]);
    expect(dueCards(cards, 16)).toHaveLength(3);
  });
});
