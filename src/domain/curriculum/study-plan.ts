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
    content: "Parte 0 completa + Parte 1 §1.1-1.4",
    milestone: "Producir /θ/, /ð/, /v/, /z/ y s- inicial de forma aislada",
    units: [],
  },
  {
    week: 2,
    content: "Parte 1 §1.5-1.8 + Retos A-B",
    milestone: "Decir 30 verbos en pasado con la terminación correcta",
    units: [],
  },
  {
    week: 3,
    content: "Parte 1 §1.9-1.12 + Reto C",
    milestone: "Shadowing de 2 min con inteligibilidad",
    units: [],
  },
  {
    week: 4,
    content: "Unidades 1-2",
    milestone: "Presentarte en 60 s sin preparar",
    units: [1, 2],
  },
  {
    week: 5,
    content: "Unidad 3 + repaso 1-2",
    milestone: "Describir tu arquitectura en 90 s",
    units: [3],
  },
  {
    week: 6,
    content: "Unidad 4",
    milestone: "Decir en qué trabajas ahora mismo, sin errores de estado",
    units: [4],
  },
  {
    week: 7,
    content: "Unidad 5",
    milestone: "Pedir cinco cosas distintas con cinco niveles de cortesía",
    units: [5],
  },
  {
    week: 8,
    content: "Unidad 6 + checklist A1",
    milestone: "Narrar tu día de ayer en 90 s con 10 irregulares",
    units: [6],
  },
  {
    week: 9,
    content: "Unidad 7",
    milestone: "Stand-up de 30 s grabado, sin guion",
    units: [7],
  },
  {
    week: 10,
    content: "Unidad 8",
    milestone: "Comparar dos tecnologías en 2 min",
    units: [8],
  },
  {
    week: 11,
    content: "Unidad 9",
    milestone: "Dar tres estimaciones con tres grados de certeza",
    units: [9],
  },
  {
    week: 12,
    content: "Unidad 10 (dedícale la semana entera)",
    milestone: "20/20 en el test de present perfect vs past simple",
    units: [10],
  },
  {
    week: 13,
    content: "Unidad 11",
    milestone: "Escribir un README que no necesite preguntas",
    units: [11],
  },
  {
    week: 14,
    content: "Unidad 12 + checklist A2",
    milestone: "Narrar un bug real en 2 min",
    units: [12],
  },
  {
    week: 15,
    content: "Unidad 13",
    milestone: "Diez comentarios de review en cuatro niveles de fuerza",
    units: [13],
  },
  {
    week: 16,
    content: "Unidad 14",
    milestone: "Un postmortem escrito con orden de sucesos correcto",
    units: [14],
  },
  {
    week: 17,
    content: "Unidad 15",
    milestone: "Un ADR con condicionales de trade-off",
    units: [15],
  },
  {
    week: 18,
    content: "Unidad 16",
    milestone: "Reportar una conversación técnica de memoria",
    units: [16],
  },
  {
    week: 19,
    content: "Unidad 17",
    milestone: "Sobrevivir 30 min de reunión con cinco intervenciones",
    units: [17],
  },
  {
    week: 20,
    content: "Unidad 18 + checklist B1",
    milestone: "Describir un sistema en 3 min con relativas",
    units: [18],
  },
  {
    week: 21,
    content: "Unidades 19-20",
    milestone: "Postmortem sin culpables + RFC con certeza calibrada",
    units: [19, 20],
  },
  {
    week: 22,
    content: "Unidades 21-22",
    milestone: "Cinco historias STAR grabadas + un system design de 40 min",
    units: [21, 22],
  },
  {
    week: 23,
    content: "Unidades 23-24",
    milestone: "Negociación completa + feedback SBI grabado",
    units: [23, 24],
  },
  {
    week: 24,
    content: "Unidades 25-26 + checklist B2",
    milestone: "Reto 72: el paquete completo en cinco registros",
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

/** Unidades cubiertas en *week*; array vacío si es de fonética o está fuera de 1-24. */
export function unitsForWeek(week: number): readonly number[] {
  const match = STUDY_PLAN_24_WEEKS.find((w) => w.week === week);
  return match ? match.units : [];
}
