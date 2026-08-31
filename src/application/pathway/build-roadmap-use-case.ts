/** Compone el roadmap completo A1→C1 a partir de los pathways por nivel. */

import { CEFR_LADDER } from "@/domain/cefr/cefr-ladder";
import { createRoadmap, levelState, type Roadmap, type RoadmapLevel } from "@/domain/pathway/roadmap";
import { BuildPathwayUseCase } from "./build-pathway-use-case";

/** Un pathway por nivel de la escalera; el estado de cada nivel deriva vs current. */
export class BuildRoadmapUseCase {
  constructor(private readonly buildPathway: BuildPathwayUseCase) {}

  async execute(userId: number, currentLevel: string): Promise<Roadmap> {
    const levels: RoadmapLevel[] = [];
    for (const level of CEFR_LADDER) {
      const pathway = await this.buildPathway.execute(userId, level);
      const state = levelState(level, currentLevel);
      levels.push({ cefrLevel: level, state, pathway });
    }
    return createRoadmap(currentLevel, levels);
  }
}
