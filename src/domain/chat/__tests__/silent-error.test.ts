import { describe, it, expect } from "vitest";
import { isActionableCorrection } from "../silent-error";
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
