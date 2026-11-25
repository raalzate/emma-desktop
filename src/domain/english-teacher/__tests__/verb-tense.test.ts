/**
 * Tiempo verbal verificado (incidente 2026-11-25, en producción): «Teach me»
 * etiquetó «You are connecting the front and back end with the API» como
 * «Presente simple». El tiempo lo escribía el modelo como texto libre y nada lo
 * verificaba: la tarjeta enseñaba algo falso. Se detecta de forma determinista
 * cuando la forma es inequívoca y, si contradice al modelo, gana la detección.
 */
import { describe, expect, it } from "vitest";
import { detectTense, reconcileTense } from "../verb-tense";
import type { GrammarStructure } from "../teaching-models";

describe("detectTense", () => {
  it.each([
    ["You are connecting the front and back end with the API.", "presente continuo"],
    ["I'm working on the login.", "presente continuo"],
    ["She was fixing the bug.", "pasado continuo"],
    ["We have deployed the service.", "presente perfecto"],
    ["I've been testing it all day.", "presente perfecto continuo"],
    ["They had finished before the demo.", "pasado perfecto"],
    ["I will send the report.", "futuro simple"],
    ["We are going to release on Friday.", "futuro con going to"],
    ["Did you fix it?", "pasado simple"],
    ["She doesn't use Java.", "presente simple"],
  ])("%s → %s", (sentence, tense) => {
    expect(detectTense(sentence)).toBe(tense);
  });

  it.each([
    "The talk is interesting.",
    "We deploy every Friday.",
    "Yesterday I finished the login page.",
    "Can you help me?",
  ])("sin marca inequívoca no adivina: %s", (sentence) => {
    expect(detectTense(sentence)).toBeNull();
  });
});

describe("reconcileTense", () => {
  const card = (): GrammarStructure => ({
    label: "Presente simple (tag question implied)",
    pattern: "Subject + verb + object + (tag question implied)",
    example: "You are connecting the front and back end with the API, right?",
    explanation: "Se usa para confirmar información.",
    tense: "Presente simple",
    examples: [
      { form: "affirmative", english: "You are connecting the front and back end with the API.", verbs: [{ text: "are", role: "main" }] },
      { form: "negative", english: "You are not connecting the front and back end with the API.", verbs: [{ text: "are", role: "main" }] },
      { form: "question", english: "You are connecting the front and back end with the API, right?", verbs: [{ text: "are", role: "main" }] },
    ],
  });

  it("corrige el tiempo y la etiqueta cuando el modelo se equivoca (el caso de producción)", () => {
    const fixed = reconcileTense(card());
    expect(fixed.tense).toBe("presente continuo");
    expect(fixed.label).toBe("Presente continuo (tag question implied)");
  });

  it("marca el verbo en -ing que el modelo no marcó, como auxiliar + principal", () => {
    const fixed = reconcileTense(card());
    for (const ex of fixed.examples!) {
      expect(ex.verbs).toEqual([
        { text: "are", role: "auxiliary" },
        { text: "connecting", role: "main" },
      ]);
    }
  });

  it("si el modelo acertó o no hay marca inequívoca, no toca nada", () => {
    const ok = { ...card(), tense: "presente continuo", label: "Presente continuo" };
    expect(reconcileTense(ok).label).toBe("Presente continuo");
    const vague: GrammarStructure = { label: "Presente simple", pattern: "", example: "We deploy every Friday.", explanation: "", tense: "presente simple" };
    expect(reconcileTense(vague)).toEqual(vague);
  });
});

describe("reconcileTense no agrega lo que el modelo no afirmó", () => {
  it("sin tiempo en el campo ni en la etiqueta, la tarjeta queda igual", () => {
    const card: GrammarStructure = { label: "Wh-question", pattern: "", example: "What do you need?", explanation: "" };
    expect(reconcileTense(card)).toEqual(card);
  });
});
