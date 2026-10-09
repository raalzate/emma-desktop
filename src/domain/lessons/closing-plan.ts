/**
 * Plan de cierre de una simulación (#211): qué ocurre cuando el feedback queda
 * listo. Con correcciones reportables, las lecciones de remediación se asignan
 * solas y el aprendiz va directo a ellas; sin correcciones no hay nada que
 * remediar y se le pregunta si practica otra vez o continúa.
 *
 * Dominio puro: decide, no asigna ni navega.
 */

import type { PracticeRecommendation } from "@/domain/tutor/practice-recommender";
import type { LessonTodoDraft, LessonTodoOrigin } from "./lesson-todo";
import { draftFromChallenge, draftFromRecommendation } from "./lesson-todo-drafts";

export type ClosingPlan = { kind: "lessons"; drafts: LessonTodoDraft[] } | { kind: "choice" };

export interface ClosingPlanInput {
  /** Correcciones reportables de la sesión (ya filtradas). */
  correctionsCount: number;
  recommendations: readonly PracticeRecommendation[];
  /** Reto de la unidad de la escena, si existe. */
  challenge: { unit: number; instructionsEs: string } | null;
  origin: LessonTodoOrigin;
}

export function closingPlanFor(input: ClosingPlanInput): ClosingPlan {
  if (input.correctionsCount <= 0) return { kind: "choice" };
  // Un escenario es "seguir adelante", no remediación.
  const drafts = input.recommendations
    .filter((r) => r.kind !== "scenario")
    .map((r) => draftFromRecommendation(r, input.origin));
  if (input.challenge) drafts.push(draftFromChallenge(input.challenge, input.origin));
  return drafts.length > 0 ? { kind: "lessons", drafts } : { kind: "choice" };
}
