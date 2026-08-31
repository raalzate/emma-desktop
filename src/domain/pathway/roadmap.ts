/** Proyección roadmap — cada nivel CEFR con su estado de completitud derivado. */

import { CEFR_LADDER } from "@/domain/cefr/cefr-ladder";
import type { Pathway } from "./pathway";

/** Dónde está un nivel respecto a la posición actual del aprendiz. */
export const LevelState = {
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress",
  UPCOMING: "upcoming",
} as const;

export type LevelState = (typeof LevelState)[keyof typeof LevelState];

/** Deriva el estado de un nivel por su posición vs *current* en la escalera. */
export function levelState(level: string, current: string): LevelState {
  const ladder = CEFR_LADDER as readonly string[];
  const levelIdx = ladder.indexOf(level);
  const currentIdx = ladder.indexOf(current);
  if (levelIdx < currentIdx) return LevelState.COMPLETED;
  if (levelIdx === currentIdx) return LevelState.IN_PROGRESS;
  return LevelState.UPCOMING;
}

/** Un peldaño de la escalera: nivel + estado + su pathway completo. */
export interface RoadmapLevel {
  cefrLevel: string;
  state: LevelState;
  pathway: Pathway;
}

/** Vista ordenada A1→C1 del viaje; siempre cubre la escalera completa. */
export interface Roadmap {
  currentLevel: string;
  levels: RoadmapLevel[];
}

/** Construye un Roadmap validando invariantes (como el __post_init__ original). */
export function createRoadmap(currentLevel: string, levels: RoadmapLevel[]): Roadmap {
  if (!(CEFR_LADDER as readonly string[]).includes(currentLevel)) {
    throw new Error(`Unknown current_level: '${currentLevel}'`);
  }
  const covered = levels.map((l) => l.cefrLevel);
  const matches =
    covered.length === CEFR_LADDER.length && covered.every((c, i) => c === CEFR_LADDER[i]);
  if (!matches) {
    throw new Error(`Roadmap must cover ${JSON.stringify(CEFR_LADDER)} in order, got ${JSON.stringify(covered)}`);
  }
  return { currentLevel, levels };
}
