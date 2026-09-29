/**
 * Traduce lo que el cierre recomienda —recomendaciones de práctica y el reto de
 * la unidad— a lecciones anotables. Aquí vive el destino de cada clase
 * (deep-link) y su título de producto, porque es la misma información que la
 * lista necesita después para ofrecer «Empezar» (#172).
 *
 * Dominio puro: sólo datos, ninguna navegación.
 */

import type { PracticeRecommendation } from "@/domain/tutor/practice-recommender";
import type { LessonTodoDraft, LessonTodoOrigin } from "./lesson-todo";

/** Destino de práctica de cada recomendación; `scenario` se abre en el chat. */
export function practiceHrefFor(rec: PracticeRecommendation): string | null {
  switch (rec.kind) {
    case "exercise":
      return `/practice?tab=exercises&unit=${rec.unit}&exercise=${rec.exerciseId}`;
    case "srs-review":
      return "/practice?tab=srs";
    case "minimal-pair":
      return `/practice?tab=pronunciation&contrast=${rec.contrastId}`;
    case "checklist":
      return `/practice?tab=assessment&level=${rec.level}`;
    case "scenario":
      return null;
  }
}

/** Objetivo concreto de la recomendación: es la clave de deduplicación. */
function targetOf(rec: PracticeRecommendation): string {
  switch (rec.kind) {
    case "exercise":
      return rec.exerciseId;
    case "srs-review":
      return "due";
    case "minimal-pair":
      return rec.contrastId;
    case "checklist":
      return rec.level;
    case "scenario":
      return rec.scenarioType;
  }
}

const TITLE_BY_KIND: Record<PracticeRecommendation["kind"], string> = {
  exercise: "Unit exercise",
  "srs-review": "Review your cards",
  "minimal-pair": "Pronunciation minimal pair",
  scenario: "Conversation scenario",
  checklist: "Level self-check",
};

export function draftFromRecommendation(
  rec: PracticeRecommendation,
  origin: LessonTodoOrigin,
): LessonTodoDraft {
  return {
    kind: rec.kind,
    target: targetOf(rec),
    titleEs: TITLE_BY_KIND[rec.kind],
    reasonEs: rec.reasonEs,
    // El escenario no vive en /practice: se abre desde la ruta del aprendiz.
    href: practiceHrefFor(rec) ?? `/chat?scenario=${targetOf(rec)}`,
    origin,
  };
}

/** El reto de la unidad, anotado igual que una recomendación. */
export function draftFromChallenge(
  challenge: { unit: number; instructionsEs: string },
  origin: LessonTodoOrigin,
): LessonTodoDraft {
  return {
    kind: "challenge",
    target: `unit-${challenge.unit}`,
    titleEs: `Unit ${challenge.unit} challenge`,
    reasonEs: challenge.instructionsEs,
    href: `/practice?tab=challenges&unit=${challenge.unit}`,
    origin,
  };
}
