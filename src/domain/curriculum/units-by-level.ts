/**
 * Unidades de práctica según el nivel del aprendiz (#357, T9).
 *
 * El "why": Ejercicios y Challenges listaban las 26 unidades del curso sin
 * importar el nivel; un aprendiz A1 veía «Third conditional» o «Negotiating
 * salary». El aprendiz ve SÓLO las unidades de su nivel (más la 0 de
 * pronunciación, que es transversal). La fuente es `unitsForLevel` del
 * catálogo, así el criterio (incluido C1 → B2) es el mismo en toda la app.
 * Dominio puro.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { unitsForLevel } from "./unit-catalog";

/** La unidad 0 (sonidos del inglés) es de todos los niveles. */
const PRONUNCIATION_UNIT = 0;

/** Unidades disponibles del nivel, en orden; incluye la 0 si está disponible. */
export function practiceUnitsFor(available: readonly number[], level: CefrLevel): number[] {
  const ofLevel = new Set(unitsForLevel(level).map((u) => u.number));
  return [...available]
    .filter((n) => n === PRONUNCIATION_UNIT || ofLevel.has(n))
    .sort((a, b) => a - b);
}

/**
 * Unidad a abrir: la pedida (deep-link) sólo si es del nivel; si no, la
 * primera de contenido del nivel; si no hay, la de pronunciación.
 */
export function pickPracticeUnit(
  available: readonly number[],
  level: CefrLevel,
  requested: number | undefined,
): number {
  const units = practiceUnitsFor(available, level);
  if (requested !== undefined && units.includes(requested)) return requested;
  return units.find((n) => n !== PRONUNCIATION_UNIT) ?? units[0] ?? PRONUNCIATION_UNIT;
}
