import { describe, expect, it } from "vitest";
import { recommendPractice } from "../practice-recommender";

describe("recommendPractice", () => {
  it("sugiere repaso SRS cuando hay 5 o más tarjetas vencidas", () => {
    const recomendaciones = recommendPractice({
      activeUnit: null,
      weakErrorCategories: [],
      pendingSrsCards: 5,
      checklistGaps: [],
    });

    expect(recomendaciones[0]).toEqual({
      kind: "srs-review",
      due: 5,
      reasonEs: "5 tarjetas pendientes de repaso",
    });
  });

  it("no sugiere repaso SRS con menos de 5 tarjetas vencidas", () => {
    const recomendaciones = recommendPractice({
      activeUnit: null,
      weakErrorCategories: [],
      pendingSrsCards: 4,
      checklistGaps: [],
    });

    expect(recomendaciones.some((r) => r.kind === "srs-review")).toBe(false);
  });

  it("sugiere el ejercicio de la unidad activa que ataca la categoría de error más débil", () => {
    const recomendaciones = recommendPractice({
      activeUnit: 1,
      weakErrorCategories: ["article"],
      pendingSrsCards: 0,
      checklistGaps: [],
    });

    const sugerencia = recomendaciones.find((r) => r.kind === "exercise");
    expect(sugerencia).toEqual({
      kind: "exercise",
      exerciseId: "1A",
      unit: 1,
      reasonEs: "débil en article → ejercicio 1A de la unidad 1",
    });
  });

  it("no sugiere ejercicio si no hay unidad activa", () => {
    const recomendaciones = recommendPractice({
      activeUnit: null,
      weakErrorCategories: ["article"],
      pendingSrsCards: 0,
      checklistGaps: [],
    });

    expect(recomendaciones.some((r) => r.kind === "exercise")).toBe(false);
  });

  it("sugiere el par mínimo por defecto cuando la unidad activa entrena /ɪ/ vs /iː/", () => {
    // Unidad 3 menciona /ɪ/ en su soundFocus (verificado contra units-a1.ts, línea ~269).
    const recomendaciones = recommendPractice({
      activeUnit: 3,
      weakErrorCategories: [],
      pendingSrsCards: 0,
      checklistGaps: [],
    });

    const sugerencia = recomendaciones.find((r) => r.kind === "minimal-pair");
    expect(sugerencia).toEqual({
      kind: "minimal-pair",
      contrastId: "i-vs-ii",
      reasonEs: "la unidad activa entrena /ɪ/ vs /iː/: practica el par mínimo",
    });
  });

  it("sugiere el escenario que ejercita la categoría de error más débil", () => {
    const recomendaciones = recommendPractice({
      activeUnit: null,
      weakErrorCategories: ["article"],
      pendingSrsCards: 0,
      checklistGaps: [],
    });

    const sugerencia = recomendaciones.find((r) => r.kind === "scenario");
    expect(sugerencia).toEqual({
      kind: "scenario",
      scenarioType: "intro_yourself",
      reasonEs: 'débil en article → practica el escenario "intro_yourself"',
    });
  });

  it("sugiere la checklist del nivel inferior incompleto cuando no hay otras señales", () => {
    const recomendaciones = recommendPractice({
      activeUnit: null,
      weakErrorCategories: [],
      pendingSrsCards: 0,
      checklistGaps: [{ level: "A1", done: 5, total: 9 }],
    });

    expect(recomendaciones[0]).toEqual({
      kind: "checklist",
      level: "A1",
      reasonEs: "checklist de A1 incompleta (5/9)",
    });
  });

  it("ordena las recomendaciones por prioridad: srs, ejercicio, par mínimo, escenario, checklist", () => {
    const recomendaciones = recommendPractice({
      activeUnit: 3,
      weakErrorCategories: ["article"],
      pendingSrsCards: 6,
      checklistGaps: [{ level: "A1", done: 5, total: 9 }],
    });

    expect(recomendaciones.map((r) => r.kind)).toEqual([
      "srs-review",
      "exercise",
      "minimal-pair",
      "scenario",
      "checklist",
    ]);
  });

  it("respeta el límite maxRecommendations", () => {
    const recomendaciones = recommendPractice({
      activeUnit: 3,
      weakErrorCategories: ["article"],
      pendingSrsCards: 6,
      checklistGaps: [{ level: "A1", done: 5, total: 9 }],
      maxRecommendations: 2,
    });

    expect(recomendaciones).toHaveLength(2);
    expect(recomendaciones.map((r) => r.kind)).toEqual(["srs-review", "exercise"]);
  });

  it("no produce recomendaciones cuando no hay ninguna señal", () => {
    const recomendaciones = recommendPractice({
      activeUnit: null,
      weakErrorCategories: [],
      pendingSrsCards: 0,
      checklistGaps: [],
    });

    expect(recomendaciones).toEqual([]);
  });
});
