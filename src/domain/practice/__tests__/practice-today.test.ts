import { describe, it, expect } from "vitest";
import { buildPracticeToday } from "../practice-today";

describe("buildPracticeToday", () => {
  it("con tarjetas vencidas, el repaso va primero", () => {
    const plan = buildPracticeToday({ dueCards: 5, challenges: { done: 2, total: 72 }, nextChallengeId: 3, activeUnit: 4 });
    expect(plan.steps[0]).toMatchObject({ tab: "srs", count: 5 });
    expect(plan.steps.map((s) => s.tab)).toEqual(["srs", "exercises", "challenges", "pronunciation"]);
  });

  it("sin tarjetas vencidas, el repaso no aparece y se ofrece la unidad activa", () => {
    const plan = buildPracticeToday({ dueCards: 0, challenges: { done: 72, total: 72 }, nextChallengeId: null, activeUnit: 9 });
    expect(plan.steps.map((s) => s.tab)).toEqual(["exercises", "pronunciation"]);
    expect(plan.steps[0].unit).toBe(9);
    expect(plan.steps[0].titleEs).toContain("9");
  });

  it("el saludo depende de la carga del día", () => {
    const heavy = buildPracticeToday({ dueCards: 12, challenges: { done: 0, total: 72 }, nextChallengeId: 1, activeUnit: null });
    const light = buildPracticeToday({ dueCards: 0, challenges: { done: 0, total: 72 }, nextChallengeId: 1, activeUnit: null });
    expect(heavy.headlineEs).not.toBe(light.headlineEs);
  });
});
