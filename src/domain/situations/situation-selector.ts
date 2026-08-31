/**
 * Selector de situación — política de compatibilidad pura.
 *
 * El "why": replica SituationSelector.filter_by_compat del origen Python:
 *   nivel ∈ v.cefrLevels  AND  (v.stackHints vacío  OR  v.stackHints ∩ {stack} ≠ ∅)
 * sumando "no retirada" y "no excluida". Como aquí `stack` es un único tag, la
 * intersección de conjuntos se reduce a `stackHints.includes(stack)`.
 * Se elige la primera coincidencia (o null si el pool queda vacío).
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { situationsFor } from "@/domain/situations/situations-catalog";
import type { SituationVariant } from "@/domain/situations/situation-variant";

interface SelectArgs {
  scenarioType: string;
  level: CefrLevel;
  stack: string;
  exclude?: string[];
}

// Predicado de compatibilidad de una variante frente al nivel/stack pedidos.
function isCompatible(v: SituationVariant, level: CefrLevel, stack: string): boolean {
  if (v.retired) return false;
  if (!v.cefrLevels.includes(level)) return false;
  return v.stackHints.length === 0 || v.stackHints.includes(stack);
}

export function selectSituation(args: SelectArgs): SituationVariant | null {
  const { scenarioType, level, stack, exclude = [] } = args;
  const pool = situationsFor(scenarioType).filter(
    (v) => !exclude.includes(v.id) && isCompatible(v, level, stack),
  );
  return pool[0] ?? null;
}
