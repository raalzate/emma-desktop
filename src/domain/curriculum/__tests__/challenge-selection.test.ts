import { describe, expect, it } from "vitest";
import {
  challengeForSession,
  challengeProgress,
  challengesForUnit,
  nextChallengeForUnit,
} from "../challenge-selection";

describe("challengesForUnit", () => {
  it("devuelve los retos de una unidad existente", () => {
    const challenges = challengesForUnit(1);
    expect(challenges.length).toBeGreaterThan(0);
    expect(challenges[0].id).toBe(1);
  });

  it("devuelve arreglo vacío para una unidad inexistente", () => {
    expect(challengesForUnit(999)).toEqual([]);
  });
});

describe("nextChallengeForUnit", () => {
  it("devuelve el primer reto no completado de la unidad", () => {
    const next = nextChallengeForUnit(1, []);
    expect(next?.id).toBe(1);
  });

  it("devuelve null cuando todos los retos de la unidad están completados", () => {
    const all = challengesForUnit(1).map((c) => c.id);
    expect(nextChallengeForUnit(1, all)).toBeNull();
  });

  it("devuelve null para una unidad inexistente", () => {
    expect(nextChallengeForUnit(999, [])).toBeNull();
  });
});

describe("challengeForSession", () => {
  it("devuelve la unidad y el siguiente reto pendiente para un escenario válido", () => {
    const result = challengeForSession("intro_yourself", "A1", []);
    expect(result).not.toBeNull();
    expect(result?.unit.scenarioTypes).toContain("intro_yourself");
    expect(result?.challenge).not.toBeNull();
  });

  it("devuelve null cuando el escenario no tiene unidad asociada", () => {
    expect(challengeForSession("escenario-inexistente", "A1", [])).toBeNull();
  });
});

describe("challengeProgress", () => {
  it("el total de retos del libro es 72", () => {
    expect(challengeProgress([]).total).toBe(72);
  });

  it("cuenta los retos completados", () => {
    expect(challengeProgress([1, 2, 3]).done).toBe(3);
  });
});
