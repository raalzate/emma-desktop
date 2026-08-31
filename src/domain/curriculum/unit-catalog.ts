/**
 * Acceso al catálogo de unidades del currículo: búsqueda por número, nivel CEFR
 * y escenario, y la unidad "de sesión" que ancla una simulación a su unidad del
 * libro. Mismo patrón que `scenario-catalog.ts` (domain reimporta datos de lib).
 */

import { CEFR_LADDER, type CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { CurriculumUnit } from "@/domain/curriculum/unit";
import { ALL_UNITS } from "@/lib/curriculum-data";

export function getUnit(number: number): CurriculumUnit | undefined {
  return ALL_UNITS.find((u) => u.number === number);
}

export function unitsForLevel(level: CefrLevel): CurriculumUnit[] {
  // El libro termina en B2: C1 practica con el material de la última unidad disponible.
  const effectiveLevel = level === "C1" ? "B2" : level;
  return ALL_UNITS.filter((u) => u.cefrLevel === effectiveLevel);
}

export function unitsForScenario(scenarioType: string): CurriculumUnit[] {
  return ALL_UNITS.filter((u) => u.scenarioTypes.includes(scenarioType));
}

function cefrDistance(a: CefrLevel, b: CefrLevel): number {
  return Math.abs(CEFR_LADDER.indexOf(a) - CEFR_LADDER.indexOf(b));
}

/**
 * Unidad que ancla una sesión de simulación: coincidencia exacta de nivel, o la
 * más cercana en la escalera CEFR (empate ⇒ prefiere el nivel inferior).
 */
export function unitForSession(
  scenarioType: string,
  level: CefrLevel,
): CurriculumUnit | undefined {
  const candidates = unitsForScenario(scenarioType);
  if (candidates.length === 0) return undefined;

  const exact = candidates.find((u) => u.cefrLevel === level);
  if (exact) return exact;

  return candidates.reduce((closest, candidate) => {
    const candidateDist = cefrDistance(candidate.cefrLevel, level);
    const closestDist = cefrDistance(closest.cefrLevel, level);
    if (candidateDist < closestDist) return candidate;
    if (candidateDist > closestDist) return closest;
    // Empate: prefiere el nivel inferior (más cercano al inicio de la escalera).
    const candidateIdx = CEFR_LADDER.indexOf(candidate.cefrLevel);
    const closestIdx = CEFR_LADDER.indexOf(closest.cefrLevel);
    return candidateIdx < closestIdx ? candidate : closest;
  });
}
