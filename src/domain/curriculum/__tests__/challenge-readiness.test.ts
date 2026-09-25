import { describe, it, expect } from "vitest";
import { wordCount, challengeReadiness, MIN_WORDS_WRITTEN } from "../challenge-readiness";
import type { UnitChallenge } from "../unit";

const written: UnitChallenge = {
  id: 3,
  instructionsEs: "Escribe un mensaje de estado.",
  criteria: ["Usa pasado simple", "Menciona el impacto"],
  mode: "written",
};

describe("wordCount", () => {
  it("cuenta palabras ignorando espacios repetidos", () => {
    expect(wordCount("  we deployed   it on Tuesday ")).toBe(5);
    expect(wordCount("")).toBe(0);
  });
});

describe("challengeReadiness", () => {
  it("escrito: falta longitud y criterios sin marcar", () => {
    const r = challengeReadiness(written, "short text", []);
    expect(r.ready).toBe(false);
    expect(r.words).toBe(2);
    expect(r.missingEs).toHaveLength(2);
    expect(r.missingEs[0]).toContain(String(MIN_WORDS_WRITTEN));
  });

  it("escrito: listo con longitud suficiente y todos los criterios", () => {
    const text = Array.from({ length: MIN_WORDS_WRITTEN }, () => "word").join(" ");
    const r = challengeReadiness(written, text, [0, 1]);
    expect(r.ready).toBe(true);
    expect(r.missingEs).toEqual([]);
  });

  it("oral: basta una nota corta y los criterios marcados", () => {
    const oral: UnitChallenge = { ...written, mode: "oral" };
    expect(challengeReadiness(oral, "done, 3 takes", [0, 1]).ready).toBe(true);
    expect(challengeReadiness(oral, "", [0, 1]).ready).toBe(false);
  });
});
