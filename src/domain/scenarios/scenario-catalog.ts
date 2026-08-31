/**
 * Acceso al catálogo de escenarios: búsqueda por tipo y filtrado por nivel CEFR.
 *
 * El "why": replica `spec_for` y la query `cefr_levels LIKE '%level%'` del
 * ScenarioRepository Python. Como los rangos son contiguos, "incluye el nivel"
 * equivale a que el índice del nivel caiga entre el mínimo y el máximo del rango.
 */

import { CEFR_LADDER, type CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { Scenario } from "@/domain/scenarios/scenario";
import { ALL_SCENARIOS } from "@/lib/scenarios-data";

export function getScenario(scenarioType: string): Scenario | undefined {
  return ALL_SCENARIOS.find((s) => s.scenarioType === scenarioType);
}

// Un escenario aplica a `level` si éste cae dentro de su rango CEFR (inclusivo).
function rangeIncludes(range: [CefrLevel, CefrLevel], level: CefrLevel): boolean {
  const idx = CEFR_LADDER.indexOf(level);
  return idx >= CEFR_LADDER.indexOf(range[0]) && idx <= CEFR_LADDER.indexOf(range[1]);
}

export function scenariosForLevel(level: CefrLevel): Scenario[] {
  return ALL_SCENARIOS.filter((s) => rangeIncludes(s.cefrRange, level));
}
