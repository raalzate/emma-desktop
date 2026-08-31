/** Construye un Pathway juntando el catálogo de escenarios con los estados guardados. */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { Scenario } from "@/domain/scenarios/scenario";
import { scenariosForLevel } from "@/domain/scenarios/scenario-catalog";
import type { IPathwayRepository } from "@/domain/pathway/i-pathway-repository";
import type { Pathway } from "@/domain/pathway/pathway";
import { createPathwayItem, type PathwayItem } from "@/domain/pathway/pathway-item";
import { PathwayStatus } from "@/domain/pathway/pathway-status";

function toItem(scenario: Scenario, statuses: Record<string, PathwayStatus>): PathwayItem {
  return createPathwayItem(
    scenario.scenarioType,
    scenario.title,
    statuses[scenario.scenarioType] ?? PathwayStatus.PENDING,
  );
}

/** Compone Pathway: escenarios del catálogo en el nivel × estados del usuario. */
export class BuildPathwayUseCase {
  constructor(private readonly pathwayRepo: IPathwayRepository) {}

  async execute(userId: number, cefrLevel: string): Promise<Pathway> {
    // Los niveles siempre son peldaños CEFR válidos; el puerto los guarda como string.
    const scenarios = scenariosForLevel(cefrLevel as CefrLevel);
    const statuses = await this.pathwayRepo.getStatuses(userId, cefrLevel);
    const items = scenarios.map((s) => toItem(s, statuses));
    return { cefrLevel, items };
  }
}
