import { describe, it, expect } from "vitest";
import { splitReportAtLesson } from "../report-sections";
import { composeSessionSummary } from "../session-summary";
import type { SilentError } from "@/domain/chat/silent-error";

const errors = [
  { label: "grammar", original: "I am working on it.", corrected: "I'm working on it." },
] as SilentError[];

describe("splitReportAtLesson — la lección se renderiza aparte, en karaoke (#171)", () => {
  const report = composeSessionSummary({
    scenarioTitle: "Daily Standup",
    level: "B1",
    turns: 3,
    errors,
    lesson: "Use contractions when you speak. Say I'm working on it.",
  });

  it("separa el reporte en lo que va antes y después de la lección", () => {
    const { before, after } = splitReportAtLesson(report);
    expect(before).toContain("Tus correcciones");
    expect(after).toContain("Siguiente paso");
  });

  it("ninguna de las dos partes repite la lección: la sección entera sale del markdown", () => {
    const { before, after } = splitReportAtLesson(report);
    expect(before).not.toContain("Lección de Emma");
    expect(after).not.toContain("Lección de Emma");
    expect(before + after).not.toContain("Use contractions");
  });

  it("sin sección de lección devuelve el reporte intacto y nada después", () => {
    const sinLeccion = composeSessionSummary({
      scenarioTitle: "Daily Standup",
      level: "B1",
      turns: 3,
      errors: [],
      lesson: null,
    });
    const { before, after } = splitReportAtLesson(sinLeccion);
    expect(before).toBe(sinLeccion);
    expect(after).toBe("");
  });
});
