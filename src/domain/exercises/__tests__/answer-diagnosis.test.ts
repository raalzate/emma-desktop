import { describe, it, expect } from "vitest";
import { diagnoseAnswer, hintFor, splitSlots } from "../answer-diagnosis";
import type { ExerciseItem } from "../exercise";

describe("splitSlots", () => {
  it("separa la respuesta por comas cuando el stem tiene varios huecos", () => {
    const item: ExerciseItem = {
      stem: "By the time he ____ (be) paged, the error ____ (reach) 40%.",
      answer: "was, had reached",
    };
    expect(splitSlots(item, "was, had reached")).toEqual(["was", "had reached"]);
  });

  it("no separa cuando el stem tiene un solo hueco aunque haya comas", () => {
    const item: ExerciseItem = { stem: "Reply: ____", answer: "Yes, I do" };
    expect(splitSlots(item, "Yes, I do")).toEqual(["yes, i do"]);
  });
});

describe("diagnoseAnswer", () => {
  const item: ExerciseItem = {
    stem: "The job ____ (run) for six hours when it crashed.",
    answer: "had been running",
    altAnswers: ["had run"],
  };

  it("correct cuando coincide con answer o una alternativa", () => {
    expect(diagnoseAnswer(item, "Had been running.").verdict).toBe("correct");
    expect(diagnoseAnswer(item, "had run").verdict).toBe("correct");
  });

  it("near cuando difiere por un error de tipeo pequeño", () => {
    const result = diagnoseAnswer(item, "had been runing");
    expect(result.verdict).toBe("near");
    expect(result.expected).toBe("had been running");
  });

  it("wrong cuando la respuesta es otra estructura", () => {
    expect(diagnoseAnswer(item, "was running").verdict).toBe("wrong");
  });

  it("wrong cuando está vacía", () => {
    expect(diagnoseAnswer(item, "   ").verdict).toBe("wrong");
  });

  it("reporta el veredicto por hueco cuando hay varios", () => {
    const multi: ExerciseItem = {
      stem: "When I ____ (check) it, it ____ (already recover).",
      answer: "checked, had already recovered",
    };
    const result = diagnoseAnswer(multi, "checked, has already recovered");
    expect(result.slots).toEqual([
      { expected: "checked", given: "checked", ok: true },
      { expected: "had already recovered", given: "has already recovered", ok: false },
    ]);
    // Un hueco de dos bien: casi.
    expect(result.verdict).toBe("near");
  });

  it("con varios huecos todos mal es wrong", () => {
    const multi: ExerciseItem = { stem: "A ____ b ____.", answer: "x, y" };
    expect(diagnoseAnswer(multi, "q, w").verdict).toBe("wrong");
  });
});

describe("hintFor", () => {
  it("nivel 1: cantidad de palabras y primera letra de cada una", () => {
    expect(hintFor("had been running", 1)).toBe("h__ b___ r______");
  });

  it("nivel 2: revela la mitad inicial de cada palabra", () => {
    expect(hintFor("had been running", 2)).toBe("ha_ be__ run____");
  });

  it("no rompe con una sola letra", () => {
    expect(hintFor("a", 1)).toBe("a");
    expect(hintFor("a", 2)).toBe("a");
  });
});
