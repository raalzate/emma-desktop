import { describe, it, expect } from "vitest";
import { startReviewSession, answerCard, addCards } from "../review-session-use-case";
import type { SrsCard } from "@/domain/srs/srs-card";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";

/** Repositorio fake en memoria para pruebas (sin mockear imports). */
function createFakeRepo(initial: SrsCard[] = []): ISrsRepository {
  let cards = [...initial];
  return {
    async loadCards() {
      return cards;
    },
    async saveCards(next) {
      cards = [...next];
    },
  };
}

const card = (overrides: Partial<SrsCard> = {}): SrsCard => ({
  id: "c1",
  kind: "sentence-production",
  box: 1,
  lastReviewedDay: 0,
  front: "front",
  back: "back",
  ...overrides,
});

describe("startReviewSession", () => {
  it("carga solo las tarjetas vencidas, ordenadas por caja ascendente", async () => {
    const repo = createFakeRepo([
      card({ id: "box3", box: 3, lastReviewedDay: 0 }),
      card({ id: "box1", box: 1, lastReviewedDay: 0 }),
      card({ id: "notDue", box: 5, lastReviewedDay: 0 }),
    ]);

    const result = await startReviewSession({ repo, today: 4 });

    expect(result.map((c) => c.id)).toEqual(["box1", "box3"]);
  });

  it("corta al límite indicado (default 15)", async () => {
    const many = Array.from({ length: 20 }, (_, i) => card({ id: `c${i}`, box: 1, lastReviewedDay: 0 }));
    const repo = createFakeRepo(many);

    const result = await startReviewSession({ repo, today: 10 });
    expect(result).toHaveLength(15);
  });

  it("respeta un límite personalizado", async () => {
    const many = Array.from({ length: 5 }, (_, i) => card({ id: `c${i}`, box: 1, lastReviewedDay: 0 }));
    const repo = createFakeRepo(many);

    const result = await startReviewSession({ repo, today: 10, limit: 2 });
    expect(result).toHaveLength(2);
  });
});

describe("answerCard", () => {
  it("aplica reviewCard y persiste el resultado", async () => {
    const repo = createFakeRepo([card({ id: "c1", box: 1, lastReviewedDay: 0 })]);

    const updated = await answerCard({ repo, cardId: "c1", correct: true, today: 1 });

    expect(updated.box).toBe(2);
    expect(updated.lastReviewedDay).toBe(1);
    const persisted = await repo.loadCards();
    expect(persisted.find((c) => c.id === "c1")?.box).toBe(2);
  });

  it("lanza error si el id no existe", async () => {
    const repo = createFakeRepo([card({ id: "c1" })]);
    await expect(answerCard({ repo, cardId: "missing", correct: true, today: 1 })).rejects.toThrow();
  });
});

describe("addCards", () => {
  it("añade tarjetas nuevas sin duplicar por id", async () => {
    const repo = createFakeRepo([card({ id: "c1" })]);

    const added = await addCards({ repo, cards: [card({ id: "c1" }), card({ id: "c2" })] });

    expect(added).toBe(1);
    const persisted = await repo.loadCards();
    expect(persisted.map((c) => c.id).sort()).toEqual(["c1", "c2"]);
  });
});
