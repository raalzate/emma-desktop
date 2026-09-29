/**
 * #193 — la tarjeta de «Teach me» no puede enseñar inglés agramatical. Con una
 * Wh-question el modelo local dejaba la palabra interrogativa y el «?» dentro
 * de la afirmación y la negación («You did not do what yesterday?»). El trío
 * se valida en el borde: si no es coherente, la estructura degrada al formato
 * de siempre en vez de mostrarlo.
 */

import { describe, it, expect } from "vitest";
import { parseGrammarPoints } from "../teaching-parsers";
import { GRAMMAR_SYSTEM } from "../teaching-prompt-text";

const bloque = (afirmacion: string, negacion: string, pregunta: string) => `STRUCTURE: Wh-question
TENSE: pasado simple
PATTERN: Wh-word + did + subject + base verb + object?
EXAMPLE: What did you do yesterday?
AFFIRMATIVE: ${afirmacion}
NEGATIVE: ${negacion}
QUESTION: ${pregunta}
WHY: Se usa para preguntar por información concreta del pasado.`;

const trio = (afirmacion: string, negacion: string, pregunta: string) =>
  parseGrammarPoints(bloque(afirmacion, negacion, pregunta))[0];

describe("parseGrammarPoints — el trío tiene que ser inglés correcto", () => {
  it("rechaza la salida real del bug: la palabra Wh y el «?» dentro de la afirmación y la negación", () => {
    const g = trio(
      "You [aux:did] what yesterday?",
      "You [aux:did] not [main:do] what yesterday?",
      "What [aux:did] you [main:do] yesterday?",
    );
    expect(g.examples).toBeUndefined();
    expect(g.label).toBe("Wh-question");
    expect(g.example).toBe("What did you do yesterday?");
  });

  it("acepta una Wh-question cuya afirmación y negación responden la pregunta", () => {
    const g = trio(
      "I [main:fixed] the login bug yesterday.",
      "I [aux:did] not [main:fix] the login bug yesterday.",
      "What [aux:did] you [main:do] yesterday?",
    );
    expect(g.examples?.map((e) => e.english)).toEqual([
      "I fixed the login bug yesterday.",
      "I did not fix the login bug yesterday.",
      "What did you do yesterday?",
    ]);
  });

  it("rechaza una pregunta sin signo de interrogación", () => {
    const g = trio(
      "I [main:fixed] the bug.",
      "I [aux:did] not [main:fix] the bug.",
      "What [aux:did] you [main:fix].",
    );
    expect(g.examples).toBeUndefined();
  });

  it("rechaza una negación sin negación", () => {
    const g = trio(
      "I [main:fixed] the bug.",
      "I [aux:did] [main:fix] the bug.",
      "[aux:Did] you [main:fix] the bug?",
    );
    expect(g.examples).toBeUndefined();
  });

  it("rechaza una afirmación que niega", () => {
    const g = trio(
      "I [aux:did] not [main:fix] the bug.",
      "I [aux:did] not [main:fix] the bug.",
      "[aux:Did] you [main:fix] the bug?",
    );
    expect(g.examples).toBeUndefined();
  });

  it("rechaza el pasado después de did: «did not fixed», «Did you fixed»", () => {
    expect(
      trio(
        "I [main:fixed] the bug.",
        "I [aux:did] not [main:fixed] the bug.",
        "[aux:Did] you [main:fix] the bug?",
      ).examples,
    ).toBeUndefined();
    expect(
      trio(
        "I [main:fixed] the bug.",
        "I [aux:didn't] [main:fix] the bug.",
        "[aux:Did] you [main:fixed] the bug?",
      ).examples,
    ).toBeUndefined();
  });

  it("no confunde verbos base que terminan en -ed: «Do you need…?»", () => {
    const g = parseGrammarPoints(`STRUCTURE: Yes/no question
TENSE: presente simple
PATTERN: Do + subject + base verb?
EXAMPLE: Do you need help?
AFFIRMATIVE: You [main:need] help.
NEGATIVE: You [aux:don't] [main:need] help.
QUESTION: [aux:Do] you [main:need] help?
WHY: Para preguntar sí o no.`)[0];
    expect(g.examples).toHaveLength(3);
  });
});

describe("GRAMMAR_SYSTEM — reglas para las preguntas", () => {
  it("pide que la afirmación y la negación respondan la pregunta, sin palabra Wh ni «?»", () => {
    expect(GRAMMAR_SYSTEM).toMatch(/ANSWER/);
    expect(GRAMMAR_SYSTEM).toMatch(/NO question word/i);
  });

  it("pide la forma base del verbo después de do/does/did", () => {
    expect(GRAMMAR_SYSTEM).toMatch(/base form/i);
  });

  it("trae un ejemplo resuelto de Wh-question con las tres formas correctas", () => {
    expect(GRAMMAR_SYSTEM).toContain("I [aux:did] not [main:fix] the login bug yesterday.");
    expect(GRAMMAR_SYSTEM).toContain("What [aux:did] you [main:do] yesterday?");
  });
});
