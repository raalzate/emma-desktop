import { describe, it, expect } from "vitest";
import { buildCardsFromExerciseMisses } from "../srs-card";
import type { UnitExercise } from "@/domain/exercises/exercise";

const exercise: UnitExercise = {
  id: "14A",
  unit: 14,
  kind: "fill",
  promptEs: "Completa con pasado simple o perfecto.",
  items: [
    { stem: "1 ____ (be)", answer: "was" },
    { stem: "2 ____ (run)", answer: "had been running", noteEs: "acción en curso" },
  ],
};

describe("buildCardsFromExerciseMisses", () => {
  it("crea una tarjeta chunk-cloze por ítem fallado con id estable", () => {
    const cards = buildCardsFromExerciseMisses(exercise, [1], 10);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: "exercise-14A-1",
      kind: "chunk-cloze",
      box: 1,
      lastReviewedDay: 10,
      front: "2 ____ (run)",
      back: "had been running",
    });
    expect(cards[0].sourceEs).toContain("14A");
  });

  it("ignora índices fuera de rango", () => {
    expect(buildCardsFromExerciseMisses(exercise, [7], 0)).toEqual([]);
  });
});
