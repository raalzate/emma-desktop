import { describe, expect, it } from "vitest";
import { recommendPractice } from "../practice-recommender";

describe("recommendPractice", () => {
  it("sugiere repaso SRS cuando hay 5 o más tarjetas vencidas", () => {
    const recomendaciones = recommendPractice({
      activeUnit: null,
      weakErrorCategories: [],
      pendingSrsCards: 5,
    });

    expect(recomendaciones[0]).toEqual({
      kind: "srs-review",
      due: 5,
      reasonEs: "5 cards due for review",
    });
  });

  it("no sugiere repaso SRS con menos de 5 tarjetas vencidas", () => {
    const recomendaciones = recommendPractice({
      activeUnit: null,
      weakErrorCategories: [],
      pendingSrsCards: 4,
    });

    expect(recomendaciones.some((r) => r.kind === "srs-review")).toBe(false);
  });

  it("sugiere el ejercicio de la unidad activa que ataca la categoría de error más débil", () => {
    const recomendaciones = recommendPractice({
      activeUnit: 1,
      weakErrorCategories: ["article"],
      pendingSrsCards: 0,
    });

    const sugerencia = recomendaciones.find((r) => r.kind === "exercise");
    expect(sugerencia).toEqual({
      kind: "exercise",
      exerciseId: "1A",
      unit: 1,
      reasonEs: "weak in article → exercise 1A from unit 1",
    });
  });

  it("no sugiere ejercicio si no hay unidad activa", () => {
    const recomendaciones = recommendPractice({
      activeUnit: null,
      weakErrorCategories: ["article"],
      pendingSrsCards: 0,
    });

    expect(recomendaciones.some((r) => r.kind === "exercise")).toBe(false);
  });

  it("sugiere el par mínimo por defecto cuando la unidad activa entrena /ɪ/ vs /iː/", () => {
    // Unidad 3 menciona /ɪ/ en su soundFocus (verificado contra units-a1.ts, línea ~269).
    const recomendaciones = recommendPractice({
      activeUnit: 3,
      weakErrorCategories: [],
      pendingSrsCards: 0,
    });

    const sugerencia = recomendaciones.find((r) => r.kind === "minimal-pair");
    expect(sugerencia).toEqual({
      kind: "minimal-pair",
      contrastId: "i-vs-ii",
      reasonEs: "your active unit trains /ɪ/ vs /iː/: practice the minimal pair",
    });
  });

  it("sugiere el escenario que ejercita la categoría de error más débil", () => {
    const recomendaciones = recommendPractice({
      activeUnit: null,
      weakErrorCategories: ["article"],
      pendingSrsCards: 0,
    });

    const sugerencia = recomendaciones.find((r) => r.kind === "scenario");
    expect(sugerencia).toEqual({
      kind: "scenario",
      scenarioType: "intro_yourself",
      reasonEs: 'weak in article → practice the "intro_yourself" scenario',
    });
  });

  it("nunca recomienda una autoevaluación: no existe ese tipo de recomendación", () => {
    const recomendaciones = recommendPractice({
      activeUnit: 3,
      weakErrorCategories: ["article"],
      pendingSrsCards: 6,
    });

    expect(recomendaciones.map((r) => r.kind)).not.toContain("checklist");
  });

  it("ordena las recomendaciones por prioridad: srs, ejercicio, par mínimo, escenario", () => {
    const recomendaciones = recommendPractice({
      activeUnit: 3,
      weakErrorCategories: ["article"],
      pendingSrsCards: 6,
    });

    expect(recomendaciones.map((r) => r.kind)).toEqual([
      "srs-review",
      "exercise",
      "minimal-pair",
      "scenario",
    ]);
  });

  it("respeta el límite maxRecommendations", () => {
    const recomendaciones = recommendPractice({
      activeUnit: 3,
      weakErrorCategories: ["article"],
      pendingSrsCards: 6,
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
    });

    expect(recomendaciones).toEqual([]);
  });
});
