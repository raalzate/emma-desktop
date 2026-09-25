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
  if (input.dueCards >= HEAVY_DUE) return "Hoy toca repasar antes que nada: hay bastante vencido.";
  if (input.dueCards > 0) return "Un repaso corto y luego a practicar.";
  return "Sin repaso pendiente: día para avanzar.";
}

export function buildPracticeToday(input: PracticeTodayInput): PracticeToday {
  const steps: PracticeStep[] = [];

  if (input.dueCards > 0) {
    steps.push({
      tab: "srs",
      titleEs: "Repaso espaciado",
      detailEs: `${input.dueCards} tarjeta(s) vencidas · 5 minutos`,
      count: input.dueCards,
    });
  }

  steps.push(
    input.activeUnit === null
      ? { tab: "exercises", titleEs: "Ejercicios", detailEs: "Elige una unidad y corrige ítem a ítem." }
      : {
          tab: "exercises",
          titleEs: `Ejercicios de la unidad ${input.activeUnit}`,
          detailEs: "Estructuras de tu unidad activa, con pistas y reintento.",
          unit: input.activeUnit,
        },
  );

  if (input.nextChallengeId !== null && input.challenges.done < input.challenges.total) {
    steps.push({
      tab: "challenges",
      titleEs: `Reto ${input.nextChallengeId}`,
      detailEs: `Output forzado · ${input.challenges.done}/${input.challenges.total} completados`,
      unit: input.activeUnit ?? undefined,
    });
  }

  steps.push({
    tab: "pronunciation",
    titleEs: "Laboratorio de sonidos",
    detailEs: "Una ronda de pares mínimos y dictado.",
  });

  return { headlineEs: headline(input), steps };
}
