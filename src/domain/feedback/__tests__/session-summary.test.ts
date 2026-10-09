import { describe, it, expect } from "vitest";
import { composeSessionSummary } from "../session-summary";
import type { SilentError } from "@/domain/chat/silent-error";

const errors: SilentError[] = [
  {
    label: "grammar",
    original: "I am working on it today.",
    corrected: "I'm working on it today.",
    turn: 3,
  } as unknown as SilentError,
];

describe("composeSessionSummary — resumen rediseñado (BUG-001)", () => {
  it("estructura en inglés con secciones, sin tablas markdown", () => {
    const md = composeSessionSummary({
      scenarioTitle: "Daily Standup",
      situationTitle: "Quiet sprint morning",
      level: "B1",
      turns: 3,
      errors,
      lesson: "Spoken English uses contractions: I'm, you're. Example: I'm working on it.",
    });
    expect(md).toContain("Daily Standup");
    expect(md).toMatch(/### ✏️ Your corrections/);
    expect(md).toMatch(/### 📚 Emma's lesson/);
    expect(md).toContain("I am working on it today.");
    expect(md).toContain("I'm working on it today.");
    expect(md).toContain("contractions");
    expect(md).not.toContain("| # |");
    expect(md).not.toMatch(/Your wording|Recurring patterns|Practice lesson/);
  });

  it("rotula el nivel como «Level N», nunca con código CEFR (FR-006)", () => {
    const md = composeSessionSummary({
      scenarioTitle: "Daily Standup",
      level: "B1",
      turns: 3,
      errors,
      lesson: null,
    });
    expect(md).toContain("**Level 3** · **Turns:**");
    expect(md).toContain("Current level: **Level 3**");
    expect(md).not.toMatch(/\bB1\b/);
  });

  it("sin lección LLM usa el consejo determinista del tipo de error dominante", () => {
    const md = composeSessionSummary({
      scenarioTitle: "Daily Standup",
      level: "B1",
      turns: 3,
      errors,
      lesson: null,
    });
    expect(md).toMatch(/### 📚 Emma's lesson/);
    expect(md.length).toBeGreaterThan(100);
  });

  it("sin errores celebra y no muestra sección de correcciones", () => {
    const md = composeSessionSummary({
      scenarioTitle: "Daily Standup",
      level: "B1",
      turns: 5,
      errors: [],
      lesson: null,
    });
    expect(md).toMatch(/with no corrections/i);
    expect(md).not.toMatch(/### ✏️/);
  });

  it("incluye el siguiente paso con el escenario de práctica recomendado", () => {
    const md = composeSessionSummary({
      scenarioTitle: "Daily Standup",
      level: "B1",
      turns: 3,
      errors,
      lesson: null,
    });
    expect(md).toMatch(/### 🎯 Next step/);
  });
});
