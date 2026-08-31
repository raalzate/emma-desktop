/** Política determinista de recomendación del próximo escenario (sin I/O ni azar). */

import { getUnit } from "@/domain/curriculum/unit-catalog";
import { unitsForWeek } from "@/domain/curriculum/study-plan";
import { SCENARIO_CATALOG } from "@/domain/goals/scenario-recommender";
import { scenarioForError } from "./error-scenario-mapping";
import { isPathwayItemPassed, type PathwayItem } from "./pathway-item";
import type { Pathway } from "./pathway";

const GOAL_BY_SCENARIO: Record<string, string> = Object.fromEntries(
  SCENARIO_CATALOG.map((s) => [s.scenarioType, s.goalName]),
);

const ERROR_BOOST = 2;
const GOAL_BOOST = 1;
// Mismo peso que ERROR_BOOST: el plan de 24 semanas es tan prioritario como el
// error recurrente para decidir qué practicar ahora.
const PLAN_BOOST = 2;

/** Por qué se sugirió un escenario, en orden de dominancia del ranking. */
export const RecommendationReason = {
  ERROR_FOCUS: "error_focus",
  PLAN_MATCH: "plan_match",
  GOAL_MATCH: "goal_match",
  CATALOG_ORDER: "catalog_order",
} as const;

export type RecommendationReason =
  (typeof RecommendationReason)[keyof typeof RecommendationReason];

/** El único escenario sugerido como próximo para un aprendiz. */
export interface NextScenarioRecommendation {
  scenarioType: string;
  title: string;
  reason: RecommendationReason;
}

/** scenarioTypes de las unidades cubiertas por *currentWeek* del plan 24 semanas. */
function scenarioTypesForWeek(currentWeek: number | undefined): Set<string> {
  if (currentWeek === undefined) return new Set();
  const units = unitsForWeek(currentWeek);
  const scenarioTypes = units.flatMap((unit) => getUnit(unit)?.scenarioTypes ?? []);
  return new Set(scenarioTypes);
}

function score(
  item: PathwayItem,
  goals: Set<string>,
  errorScenario: string | null,
  planScenarios: Set<string>,
): number {
  let s = 0;
  if (item.scenarioType === errorScenario) s += ERROR_BOOST;
  if (planScenarios.has(item.scenarioType)) s += PLAN_BOOST;
  if (goals.has(GOAL_BY_SCENARIO[item.scenarioType])) s += GOAL_BOOST;
  return s;
}

function reasonFor(
  item: PathwayItem,
  goals: Set<string>,
  errorScenario: string | null,
  planScenarios: Set<string>,
): RecommendationReason {
  if (item.scenarioType === errorScenario) return RecommendationReason.ERROR_FOCUS;
  if (planScenarios.has(item.scenarioType)) return RecommendationReason.PLAN_MATCH;
  if (goals.has(GOAL_BY_SCENARIO[item.scenarioType])) return RecommendationReason.GOAL_MATCH;
  return RecommendationReason.CATALOG_ORDER;
}

/**
 * Elige el item pendiente de mayor score; el orden de catálogo rompe empates.
 *
 * Determinista: se conserva el primer elemento maximal (orden de catálogo) para
 * scores iguales, igual que el `max` de Python.
 *
 * `currentWeek` es opcional y retrocompatible: si se pasa, da un boost (+2) a
 * los escenarios que ejercitan la(s) unidad(es) del plan de 24 semanas
 * asignadas a esa semana (ver `unitsForWeek`/`study-plan.ts`).
 */
export function recommendNext(
  pathway: Pathway,
  goalNames: string[],
  recurringError: string | null,
  currentWeek?: number,
): NextScenarioRecommendation | null {
  const pending = pathway.items.filter((item) => !isPathwayItemPassed(item));
  if (pending.length === 0) return null;
  const goals = new Set(goalNames);
  const errorScenario = scenarioForError(recurringError);
  const planScenarios = scenarioTypesForWeek(currentWeek);
  const winner = pending.reduce((best, item) =>
    score(item, goals, errorScenario, planScenarios) >
    score(best, goals, errorScenario, planScenarios)
      ? item
      : best,
  );
  return {
    scenarioType: winner.scenarioType,
    title: winner.title,
    reason: reasonFor(winner, goals, errorScenario, planScenarios),
  };
}
