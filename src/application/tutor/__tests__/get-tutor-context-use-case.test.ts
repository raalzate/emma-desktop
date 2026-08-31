import { describe, expect, it } from "vitest";
import { getTutorContext } from "../get-tutor-context-use-case";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { ISelfAssessmentRepository } from "@/domain/curriculum/i-self-assessment-repository";
import type { IErrorStatsRepository } from "@/domain/progression/i-error-stats-repository";
import type { SrsCard } from "@/domain/srs/srs-card";

// Repos falsos (DI): sin IO real, cada uno resuelve datos fijos inyectados.
function fakeSrsRepo(cards: SrsCard[]): ISrsRepository {
  return {
    loadCards: async () => cards,
    saveCards: async () => {},
  };
}

function fakeSelfAssessmentRepo(checked: string[]): ISelfAssessmentRepository {
  return {
    loadChecked: async () => checked,
    saveChecked: async () => {},
  };
}

function fakeErrorStatsRepo(stats: { errorType: string; count: number }[]): IErrorStatsRepository {
  return {
    record: async () => {},
    getRecentStats: async () => stats,
  };
}

describe("getTutorContext", () => {
  it("orquesta los repos y devuelve el TutorContext + briefing en español", async () => {
    const result = await getTutorContext({
      srsRepo: fakeSrsRepo([
        { id: "c1", box: 1, lastReviewedDay: 0, kind: "sentence-production", front: "f", back: "b" },
      ]),
      selfAssessmentRepo: fakeSelfAssessmentRepo(["A1-1"]),
      errorStatsRepo: fakeErrorStatsRepo([{ errorType: "article", count: 4 }]),
      level: "A1",
      today: 5,
      userId: 1,
    });

    expect(result.context.level).toBe("A1");
    expect(result.context.pendingSrsCards).toBe(1);
    expect(result.context.weakErrorCategories).toEqual(["article"]);
    expect(typeof result.briefingEs).toBe("string");
    expect(result.briefingEs.length).toBeGreaterThan(0);
  });

  it("suma los conteos de error de múltiples entradas de la misma categoría", async () => {
    const result = await getTutorContext({
      srsRepo: fakeSrsRepo([]),
      selfAssessmentRepo: fakeSelfAssessmentRepo([]),
      errorStatsRepo: fakeErrorStatsRepo([
        { errorType: "article", count: 2 },
        { errorType: "article", count: 3 },
      ]),
      level: "A1",
      today: 1,
      userId: 1,
    });

    expect(result.context.weakErrorCategories).toEqual(["article"]);
  });

  it("resuelve la unidad activa desde el escenario activo si se pasa", async () => {
    const result = await getTutorContext({
      srsRepo: fakeSrsRepo([]),
      selfAssessmentRepo: fakeSelfAssessmentRepo([]),
      errorStatsRepo: fakeErrorStatsRepo([]),
      level: "A1",
      today: 1,
      userId: 1,
      activeScenarioType: "intro_yourself",
    });

    expect(result.context.activeUnit).toBe(1);
  });
});
