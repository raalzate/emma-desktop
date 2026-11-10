/**
 * Máquina de estados pura de la tarjeta de audio (sin React): pasos, dictado,
 * evaluación con `checkRecall` y calificación final. El contenedor la usa con
 * `useReducer`; el audio (reproducir/grabar) es efecto y vive afuera.
 */

import type { SrsCard } from "@/domain/srs/srs-card";
import { checkRecall, type RecallVerdict } from "@/domain/srs/recall-check";

export type AudioStep = "listen" | "write" | "read";
export type PlaybackRate = 1 | 0.75;

export interface DictationResult {
  verdict: RecallVerdict;
  expected: string;
}

export interface AudioRecallState {
  step: AudioStep;
  rate: PlaybackRate;
  typed: string;
  result: DictationResult | null;
  recording: boolean;
  attemptUrl: string | null;
}

export type AudioRecallAction =
  | { type: "goWrite" }
  | { type: "rate"; rate: PlaybackRate }
  | { type: "typed"; text: string }
  | { type: "submit" }
  | { type: "goRead" }
  | { type: "recordStarted" }
  | { type: "recordStopped"; url: string };

export function stepsFor(hasClip: boolean): AudioStep[] {
  return hasClip ? ["listen", "write", "read"] : ["write", "read"];
}

export function initialAudioRecallState(hasClip: boolean): AudioRecallState {
  return { step: stepsFor(hasClip)[0], rate: 1, typed: "", result: null, recording: false, attemptUrl: null };
}

export function audioRecallReducer(
  card: Pick<SrsCard, "kind" | "front" | "back">,
  state: AudioRecallState,
  action: AudioRecallAction,
): AudioRecallState {
  switch (action.type) {
    case "goWrite":
      return { ...state, step: "write" };
    case "rate":
      return { ...state, rate: action.rate };
    case "typed":
      return state.result ? state : { ...state, typed: action.text };
    case "submit":
      if (state.result || !state.typed.trim()) return state;
      return { ...state, result: { verdict: checkRecall(card, state.typed), expected: card.back } };
    case "goRead":
      return state.result ? { ...state, step: "read" } : state;
    case "recordStarted":
      return { ...state, recording: true };
    case "recordStopped":
      return { ...state, recording: false, attemptUrl: action.url };
  }
}

/** Acierto = correct o near (igual que el repaso de texto); null si aún no se envió. */
export function gradeOf(state: AudioRecallState): { correct: boolean; verdict: RecallVerdict } | null {
  if (!state.result) return null;
  return { correct: state.result.verdict !== "wrong", verdict: state.result.verdict };
}
