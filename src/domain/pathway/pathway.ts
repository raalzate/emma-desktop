/** Agregado de items del pathway para un aprendiz en un nivel CEFR. */

import { isPathwayItemPassed, type PathwayItem } from "./pathway-item";

/** Todos los escenarios que el aprendiz debe superar para promover desde `cefrLevel`. */
export interface Pathway {
  cefrLevel: string;
  items: PathwayItem[];
}

export function pathwayTotal(pathway: Pathway): number {
  return pathway.items.length;
}

export function pathwayPassedCount(pathway: Pathway): number {
  return pathway.items.filter(isPathwayItemPassed).length;
}

export function pathwayPendingCount(pathway: Pathway): number {
  return pathwayTotal(pathway) - pathwayPassedCount(pathway);
}

/** True sólo si el pathway tiene al menos un item y todos están aprobados. */
export function isPathwayComplete(pathway: Pathway): boolean {
  return pathwayTotal(pathway) > 0 && pathwayPassedCount(pathway) === pathwayTotal(pathway);
}
