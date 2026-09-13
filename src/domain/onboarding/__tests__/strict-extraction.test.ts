import { describe, it, expect } from "vitest";
import {
  STRICT_NONE,
  buildStrictPrompts,
  parseStrictValue,
} from "../strict-extraction";

describe("strict-extraction — prompts", () => {
  it("admite explícitamente que el texto puede no contener el dato", () => {
    const { system } = buildStrictPrompts("skills", "hablar de microservicios");
    expect(system).toMatch(/may not contain/i);
    expect(system).toContain(STRICT_NONE);
  });

  it("incluye el texto crudo y qué dato se busca", () => {
    const { user } = buildStrictPrompts("skills", "I am an architect solution");
    expect(user).toContain("I am an architect solution");
    expect(user).toMatch(/skills/i);
  });

  it("no construye prompts para un paso desconocido", () => {
    expect(() => buildStrictPrompts("altura", "1.80")).toThrow();
  });
});

describe("strict-extraction — parseStrictValue", () => {
  it("rechaza NONE en cualquier forma", () => {
    expect(parseStrictValue("NONE")).toBeNull();
    expect(parseStrictValue("  none  ")).toBeNull();
    expect(parseStrictValue("NONE.")).toBeNull();
    expect(parseStrictValue('"none"')).toBeNull();
  });

  it("rechaza vacío y ruido de un carácter", () => {
    expect(parseStrictValue("")).toBeNull();
    expect(parseStrictValue("x")).toBeNull();
  });

  it("rechaza el eco de una frase entera (el modelo copió, no extrajo)", () => {
    expect(parseStrictValue("I am an architect solution", "I am an architect solution")).toBeNull();
  });

  it("acepta la respuesta directa y corta que ES el valor (Raul → Raul)", () => {
    // Caso más común del onboarding: la respuesta del aprendiz es el dato.
    expect(parseStrictValue("Raul", "Raul")).toBe("Raul");
    expect(parseStrictValue("Solutions Architect", "Solutions Architect")).toBe("Solutions Architect");
  });

  it("devuelve el valor limpio cuando el modelo extrajo algo", () => {
    expect(parseStrictValue("Solutions Architect", "I am an architect solution")).toBe("Solutions Architect");
  });
});
