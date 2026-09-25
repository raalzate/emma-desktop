import { describe, it, expect } from "vitest";
import { checkRecall, nextReviewInDays, summarizeReview, isTypedRecall } from "../recall-check";
import type { SrsCard } from "../srs-card";

const card: SrsCard = {
  id: "c1",
  kind: "sentence-production",
  box: 2,
  lastReviewedDay: 0,
  front: 'Di esto correctamente: "I go yesterday"',
  back: "I went yesterday.",
};

describe("checkRecall", () => {
  it("acepta la respuesta normalizada (mayúsculas, puntuación)", () => {
    expect(checkRecall(card, "i went yesterday")).toBe("correct");
  });
  it("marca casi cuando difiere por un tipeo", () => {
    expect(checkRecall(card, "I wnet yesterday")).toBe("near");
  });
  it("marca mal cuando es otra frase", () => {
    expect(checkRecall(card, "I go yesterday")).toBe("wrong");
  });
});

describe("isTypedRecall", () => {
  it("las tarjetas de producción y cloze se escriben; las de sonido se autoevalúan", () => {
    expect(isTypedRecall("sentence-production")).toBe(true);
    expect(isTypedRecall("chunk-cloze")).toBe(true);
    expect(isTypedRecall("minimal-pair")).toBe(false);
    expect(isTypedRecall("word-stress")).toBe(false);
  });
});

describe("nextReviewInDays", () => {
  it("acertar en caja 2 lleva a caja 3: 4 días", () => {
    expect(nextReviewInDays(card, true)).toBe(4);
  });
  it("fallar vuelve a caja 1: mañana", () => {
    expect(nextReviewInDays(card, false)).toBe(1);
  });
  it("en caja 5 acertar se queda en 16 días", () => {
    expect(nextReviewInDays({ ...card, box: 5 }, true)).toBe(16);
  });
});

describe("summarizeReview", () => {
  it("cuenta aciertos, ascensos y reinicios con mensaje", () => {
    const summary = summarizeReview([
      { cardId: "a", correct: true, fromBox: 1 },
      { cardId: "b", correct: false, fromBox: 3 },
      { cardId: "c", correct: true, fromBox: 5 },
    ]);
    expect(summary).toMatchObject({ reviewed: 3, correct: 2, promoted: 1, reset: 1, mastered: 1 });
    expect(summary.messageEs.length).toBeGreaterThan(0);
  });
});
