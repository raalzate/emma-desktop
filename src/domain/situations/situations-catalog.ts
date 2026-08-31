/**
 * Catálogo de situaciones agrupadas por escenario.
 *
 * El "why": equivalente puro de JsonSituationCatalog — indexa las variantes por
 * scenario_type. Devuelve todas las variantes del escenario (incluidas las
 * retiradas); el filtro de "activas" lo aplica quien selecciona.
 */

import type { SituationVariant } from "@/domain/situations/situation-variant";
import { ALL_SITUATIONS } from "@/lib/situations-data";

export function situationsFor(scenarioType: string): SituationVariant[] {
  return ALL_SITUATIONS.filter((v) => v.scenarioType === scenarioType);
}
