/**
 * Plan de estudio personal: las 24 semanas del método leídas desde donde está
 * el aprendiz. El "why": la tabla de semanas es una referencia editorial;
 * el aprendiz necesita saber en qué semana está, qué hizo, qué toca esta
 * semana en la app (lección, ejercicios, retos) y cuánto lleva. Todo en
 * lenguaje de producto: nunca capítulos, secciones ni «libro». Dominio puro.
 */

import { STUDY_PLAN_24_WEEKS, currentStudyWeek, type StudyWeek } from "./study-plan";
import { challengesForUnit } from "./challenge-selection";
import { getUnit } from "./unit-catalog";

export type PlanWeekStatus = "done" | "current" | "upcoming";

export interface PlanWeekView {
  week: number;
  status: PlanWeekStatus;
  /** Qué se estudia esa semana, en lenguaje de producto. */
  focusEs: string;
  unitNumbers: readonly number[];
  milestone: string;
  challenges: { done: number; total: number };
}

export interface PersonalStudyPlan {
  current: PlanWeekView;
  weeks: PlanWeekView[];
  /** Lista de tareas de la semana actual, en el orden de la app. */
  thisWeekEs: string[];
}

export interface PersonalStudyPlanInput {
  activeUnit: number | null;
  completedChallengeIds: readonly number[];
}

const SOUNDS_FOCUS_ES = "Sounds: minimal pairs, dictation and shadowing (Pronunciation tab)";

function unitLabel(unit: number): string {
  const title = getUnit(unit)?.title;
  return title ? `Unit ${unit} · ${title}` : `Unit ${unit}`;
}

function focusFor(week: StudyWeek): string {
  if (week.units.length === 0) return SOUNDS_FOCUS_ES;
  return week.units.map(unitLabel).join(" and ");
}

function challengesFor(units: readonly number[], completed: ReadonlySet<number>): { done: number; total: number } {
  const all = units.flatMap((u) => challengesForUnit(u));
  return { total: all.length, done: all.filter((c) => completed.has(c.id)).length };
}

function statusFor(week: number, current: number): PlanWeekStatus {
  if (week < current) return "done";
  return week === current ? "current" : "upcoming";
}

function thisWeekTasks(current: PlanWeekView): string[] {
  if (current.unitNumbers.length === 0) {
    return [
      "One round of minimal pairs a day (Pronunciation tab)",
      "Sounds exercises (Exercises tab)",
      `Week milestone: ${current.milestone}`,
    ];
  }
  const perUnit = current.unitNumbers.flatMap((u) => [
    `Unit ${u} lesson with Emma (Your path)`,
    `Unit ${u} exercises (Exercises tab)`,
  ]);
  return [
    ...perUnit,
    `Week challenges: ${current.challenges.done} of ${current.challenges.total} done (Challenges tab)`,
    `Week milestone: ${current.milestone}`,
  ];
}

export function buildPersonalStudyPlan(input: PersonalStudyPlanInput): PersonalStudyPlan {
  const completed = new Set(input.completedChallengeIds);
  const currentWeek = currentStudyWeek(input.activeUnit).week;
  const weeks = STUDY_PLAN_24_WEEKS.map<PlanWeekView>((w) => ({
    week: w.week,
    status: statusFor(w.week, currentWeek),
    focusEs: focusFor(w),
    unitNumbers: w.units,
    milestone: w.milestone,
    challenges: challengesFor(w.units, completed),
  }));
  const current = weeks.find((w) => w.status === "current") ?? weeks[0];
  return { current, weeks, thisWeekEs: thisWeekTasks(current) };
}
