import { describe, it, expect } from "vitest";
import { isActionableCorrection, isTrivialCorrection, reportableCorrections } from "../silent-error";
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
    })).toContain("sin correcciones");
  });
});
