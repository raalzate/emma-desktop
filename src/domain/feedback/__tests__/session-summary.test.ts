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
  it("estructura en español con secciones, sin tablas markdown", () => {
    const md = composeSessionSummary({
      scenarioTitle: "Daily Standup",
      situationTitle: "Quiet sprint morning",
      level: "B1",
      turns: 3,
      errors,
      lesson: "El inglés hablado usa contracciones: I'm, you're. Ejemplo: I'm working on it.",
    });
    expect(md).toContain("Daily Standup");
    expect(md).toMatch(/### ✏️ Tus correcciones/);
    expect(md).toMatch(/### 📚 Lección de Emma/);
    expect(md).toContain("I am working on it today.");
    expect(md).toContain("I'm working on it today.");
    expect(md).toContain("contracciones");
    expect(md).not.toContain("| # |");
    expect(md).not.toMatch(/Your wording|Recurring patterns|Practice lesson/);
  });

  it("sin lección LLM usa el consejo determinista del tipo de error dominante", () => {
    const md = composeSessionSummary({
      scenarioTitle: "Daily Standup",
      level: "B1",
      turns: 3,
      errors,
      lesson: null,
    });
    expect(md).toMatch(/### 📚 Lección de Emma/);
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
    expect(md).toMatch(/sin correcciones/i);
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
    expect(md).toMatch(/### 🎯 Siguiente paso/);
  });
});
