/**
 * Estado consolidado que EMMA usa para decidir y redirigir al aprendiz: en
 * qué semana del plan está, qué unidad tiene activa, cuántas tarjetas SRS
 * vencen, en qué categorías de error es débil y qué huecos de checklist le
 * quedan. Función pura: TODO entra por argumento (nivel, tarjetas, "hoy",
 * conteos de error, ids de checklist marcados, escenario activo opcional).
 * Ningún IO, ningún `Date.now()`.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import {
  checklistProgress,
  type CefrCheckLevel,
} from "@/domain/curriculum/self-assessment";
import {
  STUDY_PLAN_24_WEEKS,
  weekForUnit,
  weeksForCefrTarget,
} from "@/domain/curriculum/study-plan";
import { unitForSession } from "@/domain/curriculum/unit-catalog";
import { dueCards, type LeitnerCard } from "@/domain/srs/leitner";
import { recommendPractice, type PracticeRecommendation } from "./practice-recommender";

const CHECK_LEVELS: readonly CefrCheckLevel[] = ["A1", "A2", "B1", "B2"];
const WEAK_CATEGORIES_LIMIT = 3;

export interface TutorContext {
  level: CefrLevel;
  currentWeek: number;
  activeUnit: number | null;
  pendingSrsCards: number;
  weakErrorCategories: string[];
  checklistGaps: { level: CefrLevel; done: number; total: number }[];
  recommendations: PracticeRecommendation[];
}

export interface TutorContextInputs {
  level: CefrLevel;
  cards: readonly LeitnerCard[];
  today: number;
  // Conteo de ocurrencias por categoría de error (ver domain/chat/error-taxonomy).
  errorCounts: Record<string, number>;
  checkedChecklistIds: Set<string> | readonly string[];
  // Unidad activa explícita (p. ej. la de la sesión en curso). Tiene prioridad
  // sobre activeScenarioType.
  activeUnit?: number;
  // Escenario en curso, para derivar la unidad activa vía unitForSession si no
  // se pasó activeUnit.
  activeScenarioType?: string;
}

/** Categorías con conteo > 0, de la más a la menos frecuente; empate alfabético. */
function rankErrorCategories(errorCounts: Record<string, number>): string[] {
  return Object.keys(errorCounts)
    .filter((category) => errorCounts[category] > 0)
    .sort((a, b) => errorCounts[b] - errorCounts[a] || a.localeCompare(b))
    .slice(0, WEAK_CATEGORIES_LIMIT);
}

/** Unidad activa: la explícita, o la de la sesión activa (unitForSession), o null. */
function resolveActiveUnit(inputs: TutorContextInputs): number | null {
  if (inputs.activeUnit !== undefined) return inputs.activeUnit;
  if (inputs.activeScenarioType) {
    const unit = unitForSession(inputs.activeScenarioType, inputs.level);
    if (unit) return unit.number;
  }
  return null;
}

/**
 * Primera semana del plan cuyo rango objetivo (weeksForCefrTarget) contiene
 * *level*. C1 no tiene rango propio (el libro termina en B2): usa la última
 * semana del plan.
 */
function firstWeekForLevel(level: CefrLevel): number {
  const range = weeksForCefrTarget(level);
  if (range) return range.start;
  return STUDY_PLAN_24_WEEKS[STUDY_PLAN_24_WEEKS.length - 1].week;
}

/**
 * Semana actual: si hay unidad activa, la semana que la cubre (weekForUnit);
 * si no la cubre ninguna semana, o no hay unidad activa, cae a la primera
 * semana del rango objetivo del nivel actual.
 */
function resolveCurrentWeek(activeUnit: number | null, level: CefrLevel): number {
  if (activeUnit !== null) {
    const week = weekForUnit(activeUnit);
    if (week !== null) return week;
  }
  return firstWeekForLevel(level);
}

/** Huecos de checklist (done < total) de los cuatro niveles A1-B2, en ese orden. */
function checklistGapsFor(
  checked: Set<string> | readonly string[],
): { level: CefrLevel; done: number; total: number }[] {
  const checkedSet = checked instanceof Set ? checked : [...checked];
  return CHECK_LEVELS.map((level) => ({
    level,
    ...checklistProgress(level, checkedSet),
  })).filter((gap) => gap.done < gap.total);
}

export function buildTutorContext(inputs: TutorContextInputs): TutorContext {
  const activeUnit = resolveActiveUnit(inputs);
  const currentWeek = resolveCurrentWeek(activeUnit, inputs.level);
  const pendingSrsCards = dueCards(inputs.cards, inputs.today).length;
  const weakErrorCategories = rankErrorCategories(inputs.errorCounts);
  const checklistGaps = checklistGapsFor(inputs.checkedChecklistIds);

  const recommendations = recommendPractice({
    activeUnit,
    weakErrorCategories,
    pendingSrsCards,
    checklistGaps,
  });

  return {
    level: inputs.level,
    currentWeek,
    activeUnit,
    pendingSrsCards,
    weakErrorCategories,
    checklistGaps,
    recommendations,
  };
}
