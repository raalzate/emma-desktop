/**
 * Unidades de ejercicios agrupadas por nivel (#357, T9).
 *
 * El "why": el selector listaba las 27 unidades del curso sin importar el
 * nivel, así que un aprendiz A1 veía «Third conditional» o «Negotiating
 * salary» al lado de sus unidades. Primero va el nivel del aprendiz (con la
 * unidad 0 de pronunciación, que es de todos), después los demás niveles en
 * orden. Dominio puro.
 */

import { CEFR_LADDER, type CefrLevel } from "@/domain/cefr/cefr-ladder";

/** La unidad 0 (sonidos del inglés) es transversal: va con el nivel del aprendiz. */
const PRONUNCIATION_UNIT = 0;

export interface UnitGroup {
  level: CefrLevel;
  current: boolean;
  units: number[];
}

export function groupUnitsForLevel(
  available: readonly number[],
  units: readonly { number: number; cefrLevel: CefrLevel }[],
  level: CefrLevel,
): UnitGroup[] {
  const levelOf = new Map(units.map((u) => [u.number, u.cefrLevel]));
  const byLevel = new Map<CefrLevel, number[]>();
  for (const n of [...available].sort((a, b) => a - b)) {
    const l = n === PRONUNCIATION_UNIT ? level : levelOf.get(n);
    if (!l) continue;
    byLevel.set(l, [...(byLevel.get(l) ?? []), n]);
  }
  const others = CEFR_LADDER.filter((l) => l !== level && byLevel.has(l));
  const own = byLevel.has(level) ? [{ level, current: true, units: byLevel.get(level)! }] : [];
  return [...own, ...others.map((l) => ({ level: l, current: false, units: byLevel.get(l)! }))];
}

/** Primera unidad de contenido del nivel; si no hay, la primera disponible. */
export function defaultUnitFor(
  available: readonly number[],
  units: readonly { number: number; cefrLevel: CefrLevel }[],
  level: CefrLevel,
): number {
  const own = groupUnitsForLevel(available, units, level).find((g) => g.current)?.units ?? [];
  return own.find((n) => n !== PRONUNCIATION_UNIT) ?? own[0] ?? available[0] ?? PRONUNCIATION_UNIT;
}
