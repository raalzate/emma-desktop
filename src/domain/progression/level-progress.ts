/** LevelProgress — progreso visible hacia el siguiente nivel CEFR (FR-011). */

import { nextLevel as computeNextLevel } from "@/domain/cefr/cefr-ladder";

/** Cuánto avanzó el aprendiz en `level`; `nextLevel` es null en el tope. */
export interface LevelProgress {
  level: string;
  passed: number;
  required: number;
  nextLevel: string | null;
}

/** Deriva LevelProgress; siguiente nivel desde CEFR_LADDER; clampa passed a [0, required]. */
export function buildLevelProgress(
  level: string,
  passed: number,
  required: number,
): LevelProgress {
  const clamped = Math.max(0, Math.min(passed, required));
  return { level, passed: clamped, required, nextLevel: computeNextLevel(level) };
}
