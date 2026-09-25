/**
 * Máquina de estados de una sesión de ejercicio cerrado: intento → (casi →
 * reintento) → revisión → siguiente, con racha, pistas y resumen. Es un
 * reducer puro para que el componente sea sólo render y la pedagogía viva
 * probada acá. Intención: el aprendiz siempre tiene una segunda oportunidad
 * ante un "casi" y nunca ve la clave antes de intentarlo.
 */

import type { UnitExercise } from "./exercise";
import { diagnoseAnswer, type AnswerDiagnosis, type HintLevel } from "./answer-diagnosis";

export type DrillPhase = "answering" | "retrying" | "reviewing" | "finished";

export interface ItemResult {
  index: number;
  verdict: "correct" | "wrong";
  attempts: number;
  hintsUsed: number;
  given: string;
}

export interface DrillState {
  exercise: UnitExercise;
  /** Índices originales de los ítems (para mapear fallos al ejercicio fuente). */
  sourceIndexes: number[];
  round: number;
  index: number;
  phase: DrillPhase;
  attempts: number;
  hintLevel: HintLevel;
  streak: number;
  bestStreak: number;
  lastDiagnosis: AnswerDiagnosis | null;
  results: ItemResult[];
}

const MAX_ATTEMPTS = 2;
const MAX_HINT: HintLevel = 2;

export function startDrill(exercise: UnitExercise, round = 1, sourceIndexes?: number[]): DrillState {
  return {
    exercise,
    sourceIndexes: sourceIndexes ?? exercise.items.map((_, i) => i),
    round,
    index: 0,
    phase: "answering",
    attempts: 0,
    hintLevel: 0,
    streak: 0,
    bestStreak: 0,
    lastDiagnosis: null,
    results: [],
  };
}

function closeItem(state: DrillState, verdict: "correct" | "wrong", given: string, attempts: number): DrillState {
  const streak = verdict === "correct" ? state.streak + 1 : 0;
  return {
    ...state,
    phase: "reviewing",
    attempts,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    results: [
      ...state.results,
      { index: state.index, verdict, attempts, hintsUsed: state.hintLevel, given },
    ],
  };
}

/** Corrige el borrador actual. Un "casi" en el primer intento abre el reintento. */
export function submitDraft(state: DrillState, draft: string): DrillState {
  if (state.phase !== "answering" || !draft.trim()) return state;
  const item = state.exercise.items[state.index];
  const diagnosis = diagnoseAnswer(item, draft);
  const attempts = state.attempts + 1;
  const withDiagnosis = { ...state, lastDiagnosis: diagnosis };

  if (diagnosis.verdict === "correct") return closeItem(withDiagnosis, "correct", draft, attempts);
  if (diagnosis.verdict === "near" && attempts < MAX_ATTEMPTS) {
    return { ...withDiagnosis, phase: "retrying", attempts };
  }
  return closeItem(withDiagnosis, "wrong", draft, attempts);
}

export function retryItem(state: DrillState): DrillState {
  if (state.phase !== "retrying") return state;
  return { ...state, phase: "answering" };
}

export function revealHint(state: DrillState): DrillState {
  if (state.phase !== "answering" && state.phase !== "retrying") return state;
  const hintLevel = Math.min(state.hintLevel + 1, MAX_HINT) as HintLevel;
  return { ...state, hintLevel };
}

export function nextItem(state: DrillState): DrillState {
  if (state.phase !== "reviewing") return state;
  const last = state.index + 1 >= state.exercise.items.length;
  return {
    ...state,
    phase: last ? "finished" : "answering",
    index: last ? state.index : state.index + 1,
    attempts: 0,
    hintLevel: 0,
    lastDiagnosis: null,
  };
}

export interface DrillSummary {
  total: number;
  correct: number;
  /** Índices en el ejercicio FUENTE (no en la ronda), para SRS y repetición. */
  failedIndexes: number[];
  bestStreak: number;
  masteryPct: number;
  messageEs: string;
}

function messageFor(masteryPct: number, bestStreak: number): string {
  if (masteryPct === 100) return "Impecable. Esta estructura ya es tuya.";
  if (masteryPct >= 80) return `Muy bien: racha de ${bestStreak}. Un par de fallos para repasar y queda cerrado.`;
  if (masteryPct >= 50) return "Vas por buen camino. Repite los fallados: la segunda vuelta es donde se fija.";
  return "Esta estructura todavía cuesta. Guarda los fallos en Repaso y vuelve mañana con calma.";
}

export function summarizeDrill(state: DrillState): DrillSummary {
  const total = state.exercise.items.length;
  const correct = state.results.filter((r) => r.verdict === "correct").length;
  const failedIndexes = state.results
    .filter((r) => r.verdict === "wrong")
    .map((r) => state.sourceIndexes[r.index]);
  const masteryPct = total === 0 ? 0 : Math.round((correct / total) * 100);
  return {
    total,
    correct,
    failedIndexes,
    bestStreak: state.bestStreak,
    masteryPct,
    messageEs: messageFor(masteryPct, state.bestStreak),
  };
}

/** Nueva ronda sólo con los ítems fallados de la anterior. */
export function restartWithFailed(state: DrillState): DrillState {
  const failedRoundIndexes = state.results.filter((r) => r.verdict === "wrong").map((r) => r.index);
  if (failedRoundIndexes.length === 0) return startDrill(state.exercise, state.round + 1);
  const items = failedRoundIndexes.map((i) => state.exercise.items[i]);
  const sourceIndexes = failedRoundIndexes.map((i) => state.sourceIndexes[i]);
  return startDrill({ ...state.exercise, items }, state.round + 1, sourceIndexes);
}
