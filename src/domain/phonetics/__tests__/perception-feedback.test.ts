/**
 * Pares mínimos (#357, T1/T4): la palabra objetivo se oculta hasta responder
 * (en producción se veía resaltada y el ejercicio de escucha se resolvía
 * leyendo) y el resumen de la ronda se lee como un resultado, no un número.
 */
import { describe, expect, it } from "vitest";
import { maskWord, roundVerdict } from "../perception-feedback";

describe("maskWord", () => {
  it("parte la oración alrededor de la palabra objetivo (palabra completa, sin mayúsculas)", () => {
    expect(maskWord("Wait a bit.", "bit")).toEqual({ before: "Wait a ", after: "." });
    expect(maskWord("Bit by bit we ship.", "bit")).toEqual({ before: "", after: " by bit we ship." });
  });

  it("si la palabra no está, no hay nada que ocultar", () => {
    expect(maskWord("Wait a moment.", "bit")).toBeNull();
    expect(maskWord("The habit stays.", "bit")).toBeNull();
  });
});

describe("roundVerdict", () => {
  it("traduce el puntaje a un titular y un porcentaje", () => {
    expect(roundVerdict({ correct: 10, total: 10 })).toEqual({ percent: 100, tone: "great", headline: "Excellent ear!" });
    expect(roundVerdict({ correct: 7, total: 10 })).toEqual({ percent: 70, tone: "good", headline: "Good — a few sounds to reinforce" });
    expect(roundVerdict({ correct: 4, total: 10 })).toEqual({ percent: 40, tone: "keep", headline: "Keep training this sound" });
  });

  it("una ronda vacía no divide por cero", () => {
    expect(roundVerdict({ correct: 0, total: 0 }).percent).toBe(0);
  });
});
