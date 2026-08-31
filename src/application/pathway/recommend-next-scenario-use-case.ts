/** Compone pathway, metas e historial de errores en una sugerencia de próximo escenario. */

import type { IGoalRepository } from "@/domain/goals/i-goal-repository";
import type { IPathwayRepository } from "@/domain/pathway/i-pathway-repository";
import {
  recommendNext,
  type NextScenarioRecommendation,
} from "@/domain/pathway/next-scenario-policy";
import { recurringCategory } from "@/domain/progression/error-stats";
import type { IErrorStatsRepository } from "@/domain/progression/i-error-stats-repository";
import { BuildPathwayUseCase } from "./build-pathway-use-case";

/** Recomendación determinista: items pendientes × metas × errores recurrentes. */
export class RecommendNextScenarioUseCase {
  private readonly buildPathway: BuildPathwayUseCase;

  constructor(
    pathwayRepo: IPathwayRepository,
    private readonly goals: IGoalRepository,
    private readonly errorStats: IErrorStatsRepository,
  ) {
    this.buildPathway = new BuildPathwayUseCase(pathwayRepo);
  }

  /** `currentWeek` (opcional) da prioridad a los escenarios del plan de 24 semanas para esa semana. */
  async execute(
    userId: number,
    cefrLevel: string,
    currentWeek?: number,
  ): Promise<NextScenarioRecommendation | null> {
    const pathway = await this.buildPathway.execute(userId, cefrLevel);
    const goalNames = this.goals.getGoals(userId).map((goal) => goal.goalName);
    const stats = await this.errorStats.getRecentStats(userId);
    return recommendNext(pathway, goalNames, recurringCategory(stats), currentWeek);
  }
}
