/** Un slot de escenario dentro del pathway CEFR de un aprendiz. */

import { PathwayStatus } from "./pathway-status";

/** Referencia a escenario + estado de completitud por usuario en un nivel CEFR. */
export interface PathwayItem {
  scenarioType: string;
  title: string;
  status: PathwayStatus;
}

/** Crea un PathwayItem con estado PENDING por defecto (como la dataclass). */
export function createPathwayItem(
  scenarioType: string,
  title: string,
  status: PathwayStatus = PathwayStatus.PENDING,
): PathwayItem {
  return { scenarioType, title, status };
}

export function isPathwayItemPassed(item: PathwayItem): boolean {
  return item.status === PathwayStatus.PASSED;
}
