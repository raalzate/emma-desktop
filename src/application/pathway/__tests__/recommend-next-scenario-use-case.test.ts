import { describe, expect, it } from "vitest";
import { RecommendNextScenarioUseCase } from "../recommend-next-scenario-use-case";
import type { IPathwayRepository } from "@/domain/pathway/i-pathway-repository";
import type { IGoalRepository } from "@/domain/goals/i-goal-repository";
import type { IErrorStatsRepository } from "@/domain/progression/i-error-stats-repository";

function fakePathwayRepo(): IPathwayRepository {
  return {
    getStatuses: async () => ({}),
    mark: async () => {},
    reset: async () => {},
  };
}

function fakeGoalRepo(): IGoalRepository {
  return { replaceGoals: () => {}, getGoals: () => [] };
}

function fakeErrorStatsRepo(): IErrorStatsRepository {
  return { record: async () => {}, getRecentStats: async () => [] };
}

describe("RecommendNextScenarioUseCase", () => {
  it("pasa currentWeek al dominio para priorizar escenarios del plan de esa semana", async () => {
    const useCase = new RecommendNextScenarioUseCase(
      fakePathwayRepo(),
      fakeGoalRepo(),
      fakeErrorStatsRepo(),
    );

    // Semana 4 del plan de 24 semanas cubre la unidad 1 (intro_yourself, meeting_intro,
    // conference_intro): el primero de ese conjunto en el orden de catálogo gana.
    const rec = await useCase.execute(1, "A1", 4);

    expect(rec).not.toBeNull();
    expect(rec!.scenarioType).toBe("conference_intro");
    expect(rec!.reason).toBe("plan_match");
  });

  it("sin currentWeek sigue siendo retrocompatible (orden de catálogo)", async () => {
    const useCase = new RecommendNextScenarioUseCase(
      fakePathwayRepo(),
      fakeGoalRepo(),
      fakeErrorStatsRepo(),
    );

    const rec = await useCase.execute(1, "A1");
    expect(rec).not.toBeNull();
    expect(rec!.reason).toBe("catalog_order");
  });
});
