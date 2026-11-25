/**
 * Rotación de situaciones (BUG-001): el selector es determinista (primera
 * compatible) y siempre salía la misma variante. Se recuerdan las últimas
 * jugadas por escenario para excluirlas y VARIAR el caso. Vive en la UI porque
 * persiste en localStorage; la comparten el chat y el precálculo del mapa (T14
 * de #323), que tienen que elegir la MISMA situación.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { selectSituation } from "@/domain/situations/situation-selector";
import type { SituationVariant } from "@/domain/situations/situation-variant";

const RECENT_SITUATIONS_KEY = (scenarioType: string) => `emma_recent_situations_${scenarioType}`;
const RECENT_SITUATIONS_MAX = 3;

export function recentSituations(scenarioType: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SITUATIONS_KEY(scenarioType)) ?? "[]");
  } catch {
    return [];
  }
}

export function rememberSituation(scenarioType: string, id: string): void {
  try {
    const ring = [id, ...recentSituations(scenarioType).filter((x) => x !== id)];
    localStorage.setItem(
      RECENT_SITUATIONS_KEY(scenarioType),
      JSON.stringify(ring.slice(0, RECENT_SITUATIONS_MAX)),
    );
  } catch {
    /* almacenamiento no disponible: sin rotación */
  }
}

/** Situación para una escena nueva: excluye las recientes; si no queda ninguna, sin exclusión. */
export function chooseSituation(scenarioType: string, level: CefrLevel, stack = ""): SituationVariant | null {
  return (
    selectSituation({ scenarioType, level, stack, exclude: recentSituations(scenarioType) }) ??
    selectSituation({ scenarioType, level, stack })
  );
}
