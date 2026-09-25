import { describe, it, expect } from "vitest";
import { captureExerciseMisses } from "../capture-exercise-misses-use-case";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { SrsCard } from "@/domain/srs/srs-card";
import type { UnitExercise } from "@/domain/exercises/exercise";

function memoryRepo(initial: SrsCard[] = []): ISrsRepository & { cards: SrsCard[] } {
  const repo = {
    cards: initial,
    loadCards: async () => repo.cards,
    saveCards: async (cards: SrsCard[]) => {
      repo.cards = cards;
    },
  };
  return repo;
}

const exercise: UnitExercise = {
  id: "3B",
  unit: 3,
  kind: "fill",
  promptEs: "Completa",
  items: [
    { stem: "a ____", answer: "x" },
    { stem: "b ____", answer: "y" },
  ],
};

describe("captureExerciseMisses", () => {
  it("persiste una tarjeta por fallo y devuelve cuántas añadió", async () => {
    const repo = memoryRepo();
    const added = await captureExerciseMisses({ repo, exercise, failedIndexes: [0, 1], today: 3 });
    expect(added).toBe(2);
    expect(repo.cards.map((c) => c.id)).toEqual(["exercise-3B-0", "exercise-3B-1"]);
  });

  it("no duplica si el mismo ítem ya estaba guardado", async () => {
    const repo = memoryRepo();
    await captureExerciseMisses({ repo, exercise, failedIndexes: [0], today: 3 });
    const added = await captureExerciseMisses({ repo, exercise, failedIndexes: [0, 1], today: 4 });
    expect(added).toBe(1);
    expect(repo.cards).toHaveLength(2);
  });
});
