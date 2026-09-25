/**
 * #168 — la tarjeta de gramática muestra las tres formas de la misma idea con
 * el auxiliar y el verbo principal resaltados de forma distinguible. Render
 * estático: el markup basta para fijar etiquetas y tokens de color.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GrammarForms } from "@/components/chat/teach-dialog";
import { parseGrammarPoints } from "@/domain/english-teacher/teaching-parsers";

const RAW = `STRUCTURE: Present continuous
TENSE: presente continuo
PATTERN: subject + be + verb-ing
EXAMPLE: I'm working on the payment bug.
AFFIRMATIVE: I [aux:am] [main:working] on the payment bug.
NEGATIVE: I [aux:am] not [main:working] on the payment bug.
QUESTION: [aux:Are] you [main:working] on the payment bug?
WHY: Se usa para lo que ocurre ahora mismo.`;

const html = renderToStaticMarkup(
  createElement(GrammarForms, { examples: parseGrammarPoints(RAW)[0].examples! }),
);

describe("GrammarForms", () => {
  it("etiqueta las tres formas en español", () => {
    expect(html).toContain("Afirmación");
    expect(html).toContain("Negación");
    expect(html).toContain("Pregunta");
  });

  it("los ejemplos quedan en inglés, sin las marcas del modelo", () => {
    expect(html).toContain("working");
    expect(html).not.toContain("[main:");
    expect(html).not.toContain("[aux:");
  });

  it("auxiliar y verbo principal se distinguen entre sí, con tokens de tema", () => {
    expect(html).toContain("bg-accent-soft");
    expect(html).toContain("bg-primary-soft");
    expect(html).toContain("Verbo auxiliar");
    expect(html).toContain("Verbo principal");
  });
});
