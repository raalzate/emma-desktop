import { describe, expect, it } from "vitest";
import { buildTutorBriefing, SYSTEM_MAP_ES } from "../system-map";
import type { TutorContext } from "../tutor-context";

const BASE_CONTEXT: TutorContext = {
  level: "A1",
  currentWeek: 9,
  activeUnit: 8,
  pendingSrsCards: 12,
  weakErrorCategories: ["article"],
  checklistGaps: [{ level: "A1", done: 5, total: 9 }],
  recommendations: [
    { kind: "exercise", exerciseId: "3B", unit: 3, reasonEs: 'débil en article → ejercicio 3B de la unidad 3' },
  ],
};

describe("SYSTEM_MAP_ES", () => {
  it("es una descripción no vacía en español de las dinámicas de EMMA", () => {
    expect(SYSTEM_MAP_ES.length).toBeGreaterThan(0);
    expect(SYSTEM_MAP_ES).toContain("Práctica");
  });

  it("cabe en unas 15 líneas", () => {
    const lineCount = SYSTEM_MAP_ES.trim().split("\n").length;
    expect(lineCount).toBeLessThanOrEqual(16);
  });
});

describe("buildTutorBriefing", () => {
  it("incluye la semana, unidad y tarjetas pendientes", () => {
    const briefing = buildTutorBriefing(BASE_CONTEXT);

    expect(briefing).toContain("Semana 9");
    expect(briefing).toContain("Unidad 8");
    expect(briefing).toContain("12 tarjetas pendientes");
  });

  it("incluye las categorías débiles y las recomendaciones con su razón", () => {
    const briefing = buildTutorBriefing(BASE_CONTEXT);

    expect(briefing).toContain("article");
    expect(briefing).toContain("ejercicio 3B de la unidad 3");
  });

  it("es determinista: la misma entrada produce la misma salida", () => {
    expect(buildTutorBriefing(BASE_CONTEXT)).toBe(buildTutorBriefing(BASE_CONTEXT));
  });

  it("es compacto (como máximo 120 palabras)", () => {
    const briefing = buildTutorBriefing(BASE_CONTEXT);
    const wordCount = briefing.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(120);
  });

  it("funciona sin unidad activa ni recomendaciones", () => {
    const briefing = buildTutorBriefing({
      level: "A1",
      currentWeek: 3,
      activeUnit: null,
      pendingSrsCards: 0,
      weakErrorCategories: [],
      checklistGaps: [],
      recommendations: [],
    });

    expect(briefing).toContain("Semana 3");
  });
});
