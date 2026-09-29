/**
 * Plan de 24 semanas (Apéndice J del libro): calendario detallado con hito
 * medible por semana y la distribución diaria de 45 minutos. Las semanas 1-3
 * son de fonética (sin unidades numeradas); de la 4 a la 24 se cubren las
 * 26 unidades del curso, ~2 por semana.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

export interface StudyWeek {
  readonly week: number;
  readonly content: string;
  readonly milestone: string;
  readonly units: readonly number[];
}

export const STUDY_PLAN_24_WEEKS: readonly StudyWeek[] = [
  {
    week: 1,
    content: "Part 0 complete + Part 1 §1.1-1.4",
    milestone: "Produce /θ/, /ð/, /v/, /z/ and initial s- in isolation",
    units: [],
  },
  {
    week: 2,
    content: "Part 1 §1.5-1.8 + Challenges A-B",
    milestone: "Say 30 past-tense verbs with the right ending",
    units: [],
  },
  {
    week: 3,
    content: "Part 1 §1.9-1.12 + Challenge C",
    milestone: "2 min of intelligible shadowing",
    units: [],
  },
  {
    week: 4,
    content: "Units 1-2",
    milestone: "Introduce yourself in 60 s unprepared",
    units: [1, 2],
  },
  {
    week: 5,
    content: "Unit 3 + review of 1-2",
    milestone: "Describe your architecture in 90 s",
    units: [3],
  },
  {
    week: 6,
    content: "Unit 4",
    milestone: "Say what you are working on right now, with no stative-verb errors",
    units: [4],
  },
  {
    week: 7,
    content: "Unit 5",
    milestone: "Ask for five different things with five levels of politeness",
    units: [5],
  },
  {
    week: 8,
    content: "Unit 6 + A1 checklist",
    milestone: "Narrate your day yesterday in 90 s with 10 irregular verbs",
    units: [6],
  },
  {
    week: 9,
    content: "Unit 7",
    milestone: "A recorded 30 s stand-up, no script",
    units: [7],
  },
  {
    week: 10,
    content: "Unit 8",
    milestone: "Compare two technologies in 2 min",
    units: [8],
  },
  {
    week: 11,
    content: "Unit 9",
    milestone: "Give three estimates with three degrees of certainty",
    units: [9],
  },
  {
    week: 12,
    content: "Unit 10 (give it the whole week)",
    milestone: "20/20 on the present perfect vs past simple test",
    units: [10],
  },
  {
    week: 13,
    content: "Unit 11",
    milestone: "Write a README that needs no follow-up questions",
    units: [11],
  },
  {
    week: 14,
    content: "Unit 12 + A2 checklist",
    milestone: "Narrate a real bug in 2 min",
    units: [12],
  },
  {
    week: 15,
    content: "Unit 13",
    milestone: "Ten review comments at four levels of strength",
    units: [13],
  },
  {
    week: 16,
    content: "Unit 14",
    milestone: "A written postmortem with the events in the right order",
    units: [14],
  },
  {
    week: 17,
    content: "Unit 15",
    milestone: "An ADR with trade-off conditionals",
    units: [15],
  },
  {
    week: 18,
    content: "Unit 16",
    milestone: "Report a technical conversation from memory",
    units: [16],
  },
  {
    week: 19,
    content: "Unit 17",
    milestone: "Survive a 30 min meeting with five contributions",
    units: [17],
  },
  {
    week: 20,
    content: "Unit 18 + B1 checklist",
    milestone: "Describe a system in 3 min using relative clauses",
    units: [18],
  },
  {
    week: 21,
    content: "Units 19-20",
    milestone: "Blameless postmortem + RFC with calibrated certainty",
    units: [19, 20],
  },
  {
    week: 22,
    content: "Units 21-22",
    milestone: "Five recorded STAR stories + a 40 min system design",
    units: [21, 22],
  },
  {
    week: 23,
    content: "Units 23-24",
    milestone: "A full negotiation + recorded SBI feedback",
    units: [23, 24],
  },
  {
    week: 24,
    content: "Units 25-26 + B2 checklist",
    milestone: "Challenge 72: the full package in five registers",
    units: [25, 26],
  },
] as const;

/** Distribución diaria de 45 minutos (Apéndice J). Nunca saltar el repaso. */
export const DAILY_DISTRIBUTION = {
  repaso: 5,
  input: 10,
  notice: 10,
  practice: 10,
  output: 10,
} as const;

/** Semana del plan donde se cubre *unit*, o null si no existe (fuera de 1-26). */
export function weekForUnit(unit: number): number | null {
  const match = STUDY_PLAN_24_WEEKS.find((w) => w.units.includes(unit));
  return match ? match.week : null;
}

export interface WeekRange {
  readonly start: number;
  readonly end: number;
}

/** Rango de semanas para alcanzar *level*, según la tabla 0.4 del libro. */
const CEFR_TARGET_WEEKS: Record<CefrLevel, WeekRange | null> = {
  A1: { start: 3, end: 7 },
  A2: { start: 8, end: 12 },
  B1: { start: 13, end: 17 },
  B2: { start: 18, end: 23 },
  C1: null,
};

export function weeksForCefrTarget(level: CefrLevel): WeekRange | null {
  return CEFR_TARGET_WEEKS[level];
}

/**
 * Semana del plan en la que está el aprendiz según su unidad activa: sin
 * unidad → semana 1 (sonidos); unidad fuera del plan → última semana.
 */
export function currentStudyWeek(activeUnit: number | null): StudyWeek {
  const first = STUDY_PLAN_24_WEEKS[0];
  if (activeUnit === null) return first;
  const week = weekForUnit(activeUnit);
  if (week === null) return STUDY_PLAN_24_WEEKS[STUDY_PLAN_24_WEEKS.length - 1];
  return STUDY_PLAN_24_WEEKS.find((w) => w.week === week) ?? first;
}

/** Unidades cubiertas en *week*; array vacío si es de fonética o está fuera de 1-24. */
export function unitsForWeek(week: number): readonly number[] {
  const match = STUDY_PLAN_24_WEEKS.find((w) => w.week === week);
  return match ? match.units : [];
}
