/**
 * Raíz de composición de repositorios (equivalente a dependencies.py del original).
 * Construye los adaptadores del almacén JSON y devuelve el bundle inyectable en los
 * casos de uso. `goals` se hidrata async por su puerto síncrono.
 */

import type { OnboardingRepository } from "@/domain/onboarding/i-onboarding-repository";
import type { IProgressionRepository } from "@/domain/progression/i-progression-repository";
import type { IErrorStatsRepository } from "@/domain/progression/i-error-stats-repository";
import type { IPathwayRepository } from "@/domain/pathway/i-pathway-repository";
import type { IGoalRepository } from "@/domain/goals/i-goal-repository";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { ISelfAssessmentRepository } from "@/domain/curriculum/i-self-assessment-repository";
import { createProfileRepository } from "@/infrastructure/persistence/profile-repository";
import { createProgressionRepository } from "@/infrastructure/persistence/progression-repository";
import { createErrorStatsRepository } from "@/infrastructure/persistence/error-stats-repository";
import { createPathwayRepository } from "@/infrastructure/persistence/pathway-repository";
import { createGoalRepository, loadGoals } from "@/infrastructure/persistence/goal-repository";
import { createSrsRepository } from "@/infrastructure/persistence/srs-repository";
import { createSelfAssessmentRepository } from "@/infrastructure/persistence/self-assessment-repository";

/** Usuario local único de la app de escritorio. */
export const USER_ID = 1;

export interface Repositories {
  profile: OnboardingRepository;
  progression: IProgressionRepository;
  errorStats: IErrorStatsRepository;
  pathway: IPathwayRepository;
  goals: IGoalRepository;
  srs: ISrsRepository;
  selfAssessment: ISelfAssessmentRepository;
}

export async function createRepositories(): Promise<Repositories> {
  const goals = createGoalRepository(await loadGoals());
  return {
    profile: createProfileRepository(),
    progression: createProgressionRepository(),
    errorStats: createErrorStatsRepository(),
    pathway: createPathwayRepository(),
    goals,
    srs: createSrsRepository(),
    selfAssessment: createSelfAssessmentRepository(),
  };
}
