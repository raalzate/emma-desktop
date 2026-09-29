/**
 * El reto de shadowing se graba oración por oración: un párrafo entero de un
 * tirón es imposible de dictar y devuelve 0 % sin decir por qué. Y cuando el
 * dictado no oyó nada, se dice «no se oyó nada», no «0 %».
 */

import { describe, it, expect } from "vitest";
import { checkPronunciation, heardNothing, splitSentences } from "../pronunciation-check";

describe("splitSentences", () => {
  it("parte por punto, signo de pregunta o exclamación, conservando el signo", () => {
    expect(splitSentences("Before we ship, I'd check. Does it fail? Yes! Add logs.")).toEqual([
      "Before we ship, I'd check.",
      "Does it fail?",
      "Yes!",
      "Add logs.",
    ]);
  });
  it("no parte abreviaturas comunes ni decimales", () => {
    expect(splitSentences("It takes 2.5 s, e.g. under load. Then it fails.")).toEqual([
      "It takes 2.5 s, e.g. under load.",
      "Then it fails.",
    ]);
  });
  it("un texto sin puntuación final es una sola oración", () => {
    expect(splitSentences("  just one line  ")).toEqual(["just one line"]);
  });
});

describe("heardNothing", () => {
  it("es verdadero cuando el dictado no devolvió ninguna palabra", () => {
    expect(heardNothing(checkPronunciation("ship this release", ""))).toBe(true);
  });
  it("es falso en cuanto se oyó algo, aunque todo esté mal", () => {
    expect(heardNothing(checkPronunciation("ship this release", "sheep"))).toBe(false);
  });
});
