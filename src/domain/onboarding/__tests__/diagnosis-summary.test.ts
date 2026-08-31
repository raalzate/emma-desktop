import { describe, it, expect } from "vitest";
import { summarize, friendlyLabel, DISPLAY_CAP } from "../diagnosis-summary";

describe("diagnosis-summary — summarize", () => {
  it("devuelve vacío ante una lista sin notas", () => {
    expect(summarize([])).toEqual({ categories: [], totalIssues: 0 });
  });

  it("cuenta las notas por categoría y reporta el total", () => {
    const res = summarize(["tense_error", "tense_error", "article_misuse"]);
    expect(res.totalIssues).toBe(3);
    expect(res.categories[0]).toEqual({ category: "tense_error", count: 2 });
  });

  it("ordena por frecuencia desc y desempata alfabéticamente", () => {
    // article_misuse y tense_error empatan a 1 → alfabético: article_misuse antes
    const res = summarize(["spanish_interference", "spanish_interference", "tense_error", "article_misuse"]);
    expect(res.categories.map((c) => c.category)).toEqual([
      "spanish_interference",
      "article_misuse",
      "tense_error",
    ]);
  });

  it("capa el número de categorías al tope indicado (default 3)", () => {
    const notes = ["a", "b", "c", "d", "e"];
    expect(summarize(notes).categories).toHaveLength(DISPLAY_CAP);
    expect(summarize(notes, 2).categories).toHaveLength(2);
    // el total no se ve afectado por el cap
    expect(summarize(notes, 2).totalIssues).toBe(5);
  });
});

describe("diagnosis-summary — friendlyLabel", () => {
  it("traduce categorías conocidas a etiquetas humanas en español", () => {
    expect(friendlyLabel("tense_error")).toBe("tiempos verbales");
    expect(friendlyLabel("article_misuse")).toBe("artículos (a/an/the)");
    expect(friendlyLabel("two failed attempts")).toBe("expresar respuestas con claridad");
    expect(friendlyLabel("non-numeric value after retry")).toBe("números y cantidades");
    expect(friendlyLabel("spanish_interference")).toBe("traducciones directas del español");
  });

  it("convierte guiones bajos en espacios para categorías desconocidas", () => {
    expect(friendlyLabel("some_unknown_thing")).toBe("some unknown thing");
  });
});
