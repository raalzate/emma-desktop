import { describe, expect, it } from "vitest";
import { buildTutorContext } from "../tutor-context";

describe("buildTutorContext", () => {
  it("deriva la semana actual desde la unidad activa explícita (weekForUnit)", () => {
    const ctx = buildTutorContext({
      level: "A1",
      cards: [],
      today: 1,
      errorCounts: {},
      checkedChecklistIds: [],
      activeUnit: 8, // semana 10 según STUDY_PLAN_24_WEEKS
    });

    expect(ctx.activeUnit).toBe(8);
    expect(ctx.currentWeek).toBe(10);
  });

  it("deriva la unidad activa desde el escenario activo si no hay unidad explícita", () => {
    const ctx = buildTutorContext({
      level: "A1",
      cards: [],
      today: 1,
      errorCounts: {},
      checkedChecklistIds: [],
      activeScenarioType: "intro_yourself",
    });

    expect(ctx.activeUnit).toBe(1);
    expect(ctx.currentWeek).toBe(4);
  });

  it("sin unidad activa, usa la primera semana del rango objetivo del nivel actual", () => {
    const ctx = buildTutorContext({
      level: "A2",
      cards: [],
      today: 1,
      errorCounts: {},
      checkedChecklistIds: [],
    });

    expect(ctx.activeUnit).toBeNull();
    expect(ctx.currentWeek).toBe(8); // weeksForCefrTarget("A2").start
  });

  it("cuenta las tarjetas SRS vencidas para el día dado", () => {
    const ctx = buildTutorContext({
      level: "A1",
      cards: [
        { id: "c1", box: 1, lastReviewedDay: 0 },
        { id: "c2", box: 1, lastReviewedDay: 10 },
      ],
      today: 5,
      errorCounts: {},
      checkedChecklistIds: [],
    });

    expect(ctx.pendingSrsCards).toBe(1);
  });

  it("ordena las categorías de error débiles por frecuencia descendente", () => {
    const ctx = buildTutorContext({
      level: "A1",
      cards: [],
      today: 1,
      errorCounts: { article: 2, preposition: 5, grammar: 3 },
      checkedChecklistIds: [],
    });

    expect(ctx.weakErrorCategories).toEqual(["preposition", "grammar", "article"]);
  });

  it("reporta los huecos de checklist de los niveles incompletos", () => {
    const ctx = buildTutorContext({
      level: "A1",
      cards: [],
      today: 1,
      errorCounts: {},
      checkedChecklistIds: ["A1-1", "A1-2"],
    });

    const a1Gap = ctx.checklistGaps.find((g) => g.level === "A1");
    expect(a1Gap).toEqual({ level: "A1", done: 2, total: 9 });
    expect(ctx.checklistGaps.every((g) => g.done < g.total)).toBe(true);
  });

  it("incluye recomendaciones derivadas del contexto consolidado", () => {
    const ctx = buildTutorContext({
      level: "A1",
      cards: [{ id: "c1", box: 1, lastReviewedDay: 0 }],
      today: 5,
      errorCounts: {},
      checkedChecklistIds: [],
      activeUnit: 1,
    });

    expect(Array.isArray(ctx.recommendations)).toBe(true);
  });
});
