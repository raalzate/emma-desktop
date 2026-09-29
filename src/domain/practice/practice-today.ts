/**
 * Plan de práctica del día: ordena las pestañas de Práctica según lo que el
 * aprendiz tiene pendiente (repaso vencido primero, luego la unidad activa,
 * el siguiente reto y el laboratorio de sonidos). El "why": una pantalla con
 * seis pestañas iguales no dice por dónde empezar; el método del libro sí
 * (repaso → practice → output).
 */

export type PracticeTab = "srs" | "exercises" | "challenges" | "pronunciation";

export interface PracticeStep {
  tab: PracticeTab;
  titleEs: string;
  detailEs: string;
  count?: number;
  unit?: number;
}

export interface PracticeTodayInput {
  dueCards: number;
  challenges: { done: number; total: number };
  nextChallengeId: number | null;
  activeUnit: number | null;
}

export interface PracticeToday {
  headlineEs: string;
  steps: PracticeStep[];
}

const HEAVY_DUE = 10;

function headline(input: PracticeTodayInput): string {
  if (input.dueCards >= HEAVY_DUE) return "Review comes first today: a lot is overdue.";
  if (input.dueCards > 0) return "A short review, then on to practice.";
  return "Nothing to review: a day to move forward.";
}

export function buildPracticeToday(input: PracticeTodayInput): PracticeToday {
  const steps: PracticeStep[] = [];

  if (input.dueCards > 0) {
    steps.push({
      tab: "srs",
      titleEs: "Spaced review",
      detailEs: `${input.dueCards} card(s) due · 5 min`,
      count: input.dueCards,
    });
  }

  steps.push(
    input.activeUnit === null
      ? { tab: "exercises", titleEs: "Exercises", detailEs: "Pick a unit and check item by item." }
      : {
          tab: "exercises",
          titleEs: `Unit ${input.activeUnit} exercises`,
          detailEs: "Structures from your active unit, with hints and a retry.",
          unit: input.activeUnit,
        },
  );

  if (input.nextChallengeId !== null && input.challenges.done < input.challenges.total) {
    steps.push({
      tab: "challenges",
      titleEs: `Challenge ${input.nextChallengeId}`,
      detailEs: `Forced output · ${input.challenges.done}/${input.challenges.total} completed`,
      unit: input.activeUnit ?? undefined,
    });
  }

  steps.push({
    tab: "pronunciation",
    titleEs: "Sound lab",
    detailEs: "One round of minimal pairs and dictation.",
  });

  return { headlineEs: headline(input), steps };
}
