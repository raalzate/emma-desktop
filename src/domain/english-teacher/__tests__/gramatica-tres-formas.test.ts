/**
 * #168 — la tarjeta de gramática enseña el patrón con las tres formas de la
 * misma idea (afirmación, negación, pregunta), el tiempo verbal en español y
 * los verbos marcados. El parser valida en el borde: o entra el trío completo
 * con sus verbos, o la estructura degrada al formato de siempre.
 */

import { describe, it, expect } from "vitest";
import { parseGrammarPoints } from "../teaching-parsers";

const COMPLETO = `STRUCTURE: Present continuous
TENSE: presente continuo
PATTERN: subject + be + verb-ing
EXAMPLE: I'm working on the payment bug.
AFFIRMATIVE: I [aux:am] [main:working] on the payment bug.
NEGATIVE: I [aux:am] not [main:working] on the payment bug.
QUESTION: [aux:Are] you [main:working] on the payment bug?
WHY: Se usa para lo que ocurre ahora mismo.`;

describe("parseGrammarPoints — tres formas, tiempo verbal y verbos marcados", () => {
  it("devuelve las tres formas de la misma idea, etiquetadas", () => {
    const [g] = parseGrammarPoints(COMPLETO);
    expect(g.examples?.map((e) => e.form)).toEqual(["affirmative", "negative", "question"]);
    expect(g.examples?.[2].english).toBe("Are you working on the payment bug?");
  });

  it("nombra el tiempo verbal en español", () => {
    expect(parseGrammarPoints(COMPLETO)[0].tense).toBe("presente continuo");
  });

  it("marca el auxiliar y el verbo principal por separado, y limpia las marcas del texto", () => {
    const [g] = parseGrammarPoints(COMPLETO);
    const afirmacion = g.examples![0];
    expect(afirmacion.english).toBe("I am working on the payment bug.");
    expect(afirmacion.verbs).toEqual([
      { text: "am", role: "auxiliary" },
      { text: "working", role: "main" },
    ]);
  });

  it("conserva el formato de siempre: label, pattern, example y explicación", () => {
    const [g] = parseGrammarPoints(COMPLETO);
    expect(g.label).toBe("Present continuous");
    expect(g.pattern).toBe("subject + be + verb-ing");
    expect(g.example).toBe("I'm working on the payment bug.");
    expect(g.explanation).toContain("ocurre ahora mismo");
  });

  it("degrada sin romper cuando falta una de las tres formas", () => {
    const incompleto = `STRUCTURE: Present continuous
TENSE: presente continuo
PATTERN: subject + be + verb-ing
EXAMPLE: I'm working on it.
AFFIRMATIVE: I [aux:am] [main:working] on it.
WHY: Se usa para lo que ocurre ahora mismo.`;
    const [g] = parseGrammarPoints(incompleto);
    expect(g.examples).toBeUndefined();
    expect(g.label).toBe("Present continuous");
    expect(g.example).toBe("I'm working on it.");
  });

  it("degrada cuando un ejemplo llega sin marcas de verbo: nada de datos a medias", () => {
    const sinVerbos = `STRUCTURE: Present continuous
PATTERN: subject + be + verb-ing
AFFIRMATIVE: I am working on it.
NEGATIVE: I am not working on it.
QUESTION: Are you working on it?
WHY: Se usa para lo que ocurre ahora mismo.`;
    expect(parseGrammarPoints(sinVerbos)[0].examples).toBeUndefined();
  });

  it("la salida vieja del modelo sigue parseando igual", () => {
    const viejo = `STRUCTURE: Wh-question
PATTERN: What + do + subject + base verb ?
EXAMPLE: What do you need?
WHY: Para pedir información concreta.`;
    const [g] = parseGrammarPoints(viejo);
    expect(g.examples).toBeUndefined();
    expect(g.tense).toBeUndefined();
    expect(g.pattern).toBe("What + do + subject + base verb ?");
  });

  it("basura pura no produce estructuras", () => {
    expect(parseGrammarPoints("lorem ipsum\n???\n")).toEqual([]);
  });
});
