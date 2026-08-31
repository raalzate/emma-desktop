import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserPrompt } from "../comprehend-prompts";
import { STEP_SCHEMAS } from "../step-extraction-schema";

describe("comprehend-prompts — buildSystemPrompt", () => {
  it("inserta la descripción del esquema en todas sus apariciones", () => {
    const s = buildSystemPrompt(STEP_SCHEMAS.name);
    // {description} aparece dos veces en la plantilla → replaceAll
    expect(s).not.toMatch(/\{description\}/);
    const occurrences = s.split(STEP_SCHEMAS.name.description).length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });

  it("inserta las restricciones del esquema", () => {
    const s = buildSystemPrompt(STEP_SCHEMAS.age);
    expect(s).toMatch(new RegExp(STEP_SCHEMAS.age.constraints.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    expect(s).not.toMatch(/\{constraints\}/);
  });
});

describe("comprehend-prompts — buildUserPrompt", () => {
  it("incluye descripción y la respuesta cruda", () => {
    const u = buildUserPrompt(STEP_SCHEMAS.role, "I'm a backend developer");
    expect(u).toMatch(STEP_SCHEMAS.role.description);
    expect(u).toMatch(/I'm a backend developer/);
    expect(u).not.toMatch(/\{raw\}/);
  });
});
