/** Extrae el pathway del nivel actual desde el roadmap completo A1→C1. */

import type { Roadmap } from "@/domain/pathway/roadmap";
import type { Pathway } from "@/domain/pathway/pathway";

/** Pathway del nivel en curso; vacío si el roadmap no lo cubre (no debería pasar). */
export function currentPathway(roadmap: Roadmap): Pathway {
  const level = roadmap.levels.find((l) => l.cefrLevel === roadmap.currentLevel);
  return level ? level.pathway : { cefrLevel: roadmap.currentLevel, items: [] };
}
