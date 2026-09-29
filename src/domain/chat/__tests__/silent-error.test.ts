import { describe, it, expect } from "vitest";
import { isActionableCorrection, isTrivialCorrection, isRephrase, reportableCorrections } from "../silent-error";
import { classifyError } from "../error-taxonomy";
import { composeSessionSummary } from "@/domain/feedback/session-summary";
import type { SilentError } from "../silent-error";

const err = (original: string, corrected: string): SilentError =>
  ({ label: "grammar", original, corrected }) as SilentError;

describe("isActionableCorrection — filtra no-correcciones del LLM (BUG-001)", () => {
  it("rechaza la respuesta meta '(No correction needed for this input.)'", () => {
    expect(isActionableCorrection(err("ok", "(No correction needed for this input.)"))).toBe(false);
  });

  it("rechaza variantes: 'no change', 'already correct', 'correct as is', 'N/A'", () => {
    expect(isActionableCorrection(err("hello", "No change needed."))).toBe(false);
    expect(isActionableCorrection(err("hello", "The sentence is already correct."))).toBe(false);
    expect(isActionableCorrection(err("hello", "Correct as is"))).toBe(false);
    expect(isActionableCorrection(err("hello", "N/A"))).toBe(false);
  });

  it("rechaza correcciones idénticas al original o vacías", () => {
    expect(isActionableCorrection(err("I am fine.", "I am fine."))).toBe(false);
    expect(isActionableCorrection(err("I am fine.", "  "))).toBe(false);
  });

  it("acepta una corrección real", () => {
    expect(isActionableCorrection(err("I am working on it.", "I'm working on it."))).toBe(true);
  });
});

describe("isTrivialCorrection — puntuación, mayúsculas y espacios no son lección (#170)", () => {
  it("marca como triviales las tres etiquetas de superficie", () => {
    expect(isTrivialCorrection("punctuation")).toBe(true);
    expect(isTrivialCorrection("capitalization")).toBe(true);
    expect(isTrivialCorrection("spacing")).toBe(true);
  });

  it("no marca como trivial nada que enseñe gramática", () => {
    for (const label of ["article", "preposition", "word_form", "word_order", "grammar"] as const) {
      expect(isTrivialCorrection(label)).toBe(false);
    }
  });
});

describe("reportableCorrections — un solo criterio de «error» de la sesión (#170)", () => {
  const labelled = (original: string, corrected: string): SilentError => ({
    label: classifyError(original, corrected),
    original,
    corrected,
  });

  it("deja fuera la mayúscula inicial y el punto final", () => {
    const entrada = [
      labelled("i am ready", "I am ready"),
      labelled("I am ready", "I am ready."),
      labelled("I  am ready.", "I am ready."),
    ];
    expect(reportableCorrections(entrada)).toEqual([]);
  });

  it("conserva la corrección gramatical aunque también cambie mayúsculas", () => {
    const mixta = labelled("i finished login issues", "I fixed the issues");
    expect(mixta.label).not.toBe("capitalization");
    expect(reportableCorrections([mixta])).toEqual([mixta]);
  });

  it("sigue descartando las meta-respuestas del checker", () => {
    expect(reportableCorrections([err("ok", "(No correction needed for this input.)")])).toEqual([]);
  });

  it("cuando todo es trivial la sesión queda sin correcciones", () => {
    const soloTriviales = [labelled("i am ready", "I am ready")];
    expect(reportableCorrections(soloTriviales)).toHaveLength(0);
    expect(composeSessionSummary({
      scenarioTitle: "Daily Standup",
      level: "B1",
      turns: 3,
      errors: reportableCorrections(soloTriviales),
      lesson: null,
    })).toContain("with no corrections");
  });
});

describe("isRephrase — el corrector cambió palabras, no gramática", () => {
  it("un sinónimo por otro no es un error: issues → tasks", () => {
    expect(isRephrase(err("I finished the issues", "I finished the tasks."))).toBe(true);
  });
  it("reescribir más de la mitad de la frase es reformular, no corregir", () => {
    expect(
      isRephrase(err("I came for the talk on microservices.", "I came to the introduction to the topic.")),
    ).toBe(true);
  });
  it("un verbo irregular corregido sí es error: go → went, think → thought", () => {
    expect(isRephrase(err("I go to school yesterday", "I went to school yesterday"))).toBe(false);
    expect(isRephrase(err("I think about it last night", "I thought about it last night"))).toBe(false);
  });
  it("cambiar una palabra de función (auxiliar, artículo, preposición) sí es error", () => {
    expect(isRephrase(err("She don't like it", "She doesn't like it"))).toBe(false);
    expect(isRephrase(err("I am agree", "I agree"))).toBe(false);
    expect(isRephrase(err("depends of you", "depends on you"))).toBe(false);
  });
  it("agregar lo que faltaba sí es error: need finished → need to have finished", () => {
    expect(isRephrase(err("yes, i need finished the login form", "Yes, I need to have finished the login form."))).toBe(false);
  });
  it("una forma de la misma palabra sí es error: task → tasks", () => {
    expect(isRephrase(err("I finished the task", "I finished the tasks"))).toBe(false);
  });
  it("una falta de ortografía sí es error, aunque sea la única palabra: Nathing → Nothing", () => {
    expect(isRephrase(err("Nathing", "Nothing"))).toBe(false);
    expect(isRephrase(err("I recieved the mail", "I received the mail"))).toBe(false);
  });
  it("borrar una palabra de contenido sin cambiar nada más es reformular: API contract → API", () => {
    expect(isRephrase(err("I'm looking into the API contract now.", "I'm looking into the API now."))).toBe(true);
  });
  it("truncar la frase quitando contenido es reformular: nothing for now → Nothing.", () => {
    expect(isRephrase(err("nothing for now", "Nothing."))).toBe(true);
  });
  it("borrar una palabra de función sí es corregir: I am agree → I agree", () => {
    expect(isRephrase(err("I am agree", "I agree"))).toBe(false);
    expect(isRephrase(err("I very like it", "I like it"))).toBe(false);
  });
});

describe("isActionableCorrection rechaza marcadores del modelo", () => {
  it("un corregido con [placeholder] no es una corrección", () => {
    expect(isActionableCorrection(err("I need access to api key the Auth0", "I need the API key for [service/resource]."))).toBe(false);
  });
});

describe("reportableCorrections deja fuera las reformulaciones", () => {
  it("issues → tasks no entra a la lección ni a las tarjetas", () => {
    const entrada = [
      { label: classifyError("I finished the issues", "I finished the tasks."), original: "I finished the issues", corrected: "I finished the tasks." },
      { label: classifyError("I go yesterday", "I went yesterday"), original: "I go yesterday", corrected: "I went yesterday" },
    ];
    expect(reportableCorrections(entrada).map((e) => e.corrected)).toEqual(["I went yesterday"]);
  });
});
