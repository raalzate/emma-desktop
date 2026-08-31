import { describe, it, expect } from "vitest";
import { normalizeAnswer, evaluateItem, gradeExercise } from "../evaluate-exercise";
import type { ExerciseItem, UnitExercise } from "../exercise";

describe("normalizeAnswer", () => {
  it("recorta espacios, pasa a minúsculas y colapsa espacios internos", () => {
    expect(normalizeAnswer("  Hello   World  ")).toBe("hello world");
  });

  it("quita puntuación final", () => {
    expect(normalizeAnswer("I am fine.")).toBe("i am fine");
    expect(normalizeAnswer("Really?!")).toBe("really");
  });

  it("normaliza apóstrofes tipográficos a apóstrofe simple", () => {
    expect(normalizeAnswer("don’t")).toBe("don't");
  });
});

describe("evaluateItem", () => {
  const item: ExerciseItem = {
    stem: "I ___ happy.",
    answer: "am",
    altAnswers: ["'m"],
  };

  it("marca correcto cuando la respuesta coincide con answer normalizado", () => {
    const result = evaluateItem(item, "  Am ");
    expect(result.correct).toBe(true);
    expect(result.expected).toBe("am");
  });

  it("marca correcto cuando la respuesta coincide con una altAnswer", () => {
    const result = evaluateItem(item, "'m");
    expect(result.correct).toBe(true);
  });

  it("marca incorrecto cuando no coincide con ninguna", () => {
    const result = evaluateItem(item, "is");
    expect(result.correct).toBe(false);
    expect(result.expected).toBe("am");
  });
});

describe("gradeExercise", () => {
  const exercise: UnitExercise = {
    id: "1A",
    unit: 1,
    kind: "fill",
    promptEs: "Completa los huecos",
    items: [
      { stem: "1", answer: "am" },
      { stem: "2", answer: "is" },
      { stem: "3", answer: "are" },
    ],
  };

  it("cuenta aciertos y reporta los índices fallidos", () => {
    const result = gradeExercise(exercise, ["am", "was", "are"]);
    expect(result.total).toBe(3);
    expect(result.correct).toBe(2);
    expect(result.failedIndexes).toEqual([1]);
  });

  it("lanza error si el número de respuestas no coincide con el de items", () => {
    expect(() => gradeExercise(exercise, ["am", "is"])).toThrow();
  });
});
