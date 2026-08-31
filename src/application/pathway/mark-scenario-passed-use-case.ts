/** Marca un escenario como aprobado para un usuario en un nivel CEFR. */

import type { IPathwayRepository } from "@/domain/pathway/i-pathway-repository";
import { PathwayStatus } from "@/domain/pathway/pathway-status";

/** Upsert de una tupla (usuario, nivel, escenario) como PASSED. */
export class MarkScenarioPassedUseCase {
  constructor(private readonly repo: IPathwayRepository) {}

  async execute(userId: number, cefrLevel: string, scenarioType: string): Promise<void> {
    await this.repo.mark(userId, cefrLevel, scenarioType, PathwayStatus.PASSED);
  }
}
