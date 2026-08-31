/**
 * Objetos de valor de la sesión de simulación (portado de
 * src/domain/chat/simulation_session.py): contador de turnos, búfer de errores
 * silenciosos e historial de chat con tope. Puro: helpers inmutables que
 * devuelven una sesión nueva (sin mutar la de entrada).
 */

import { MAX_HISTORY_TURNS } from "@/config/session-config";
import type { SilentError } from "./silent-error";

export type { SilentError };

export const DEFAULT_MAX_TURNS = 10;

// Intercambios rápidos cierran pronto (los principiantes terminan una escena aún
// frescos); los de fondo tienen más aire. Por debajo de MIN_TURNS_TO_COUNT (5)
// no se podría calificar, así que 6 es el piso.
export const MAX_TURNS_BY_SCENARIO: Record<string, number> = {
  daily_standup: 8,
  code_review: 12,
  retrospective: 10,
  architecture_pitch: 10,
  morning_greeting: 6,
  slack_status_update: 6,
  meeting_intro: 6,
  coffee_break: 8,
  lunch_chat: 8,
  intro_yourself: 8,
  conference_intro: 8,
  ask_for_help: 8,
  vacation_request: 8,
  tech_interview: 12,
  incident_postmortem: 12,
  design_review: 12,
};

/** Presupuesto de turnos para un scenarioType (default si no está mapeado). */
export function maxTurnsFor(scenarioType: string | null | undefined): number {
  if (!scenarioType) return DEFAULT_MAX_TURNS;
  return MAX_TURNS_BY_SCENARIO[scenarioType] ?? DEFAULT_MAX_TURNS;
}

/** Un mensaje del historial de conversación. */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  /** Marca de tiempo (epoch ms) para mostrar hora en la burbuja. */
  at?: number;
  /** URL del audio grabado (nota de voz del aprendiz). Sólo en sesión, no persiste. */
  audioUrl?: string;
}

/** Contador de turnos + búfer de errores + historial de una simulación. */
export interface SimulationSession {
  scenarioType: string;
  maxTurns: number;
  turnCount: number;
  errors: SilentError[];
  history: ChatTurn[];
  situationRerolled: boolean;
}

/** Crea una sesión nueva (maxTurns se deriva del scenarioType si no se pasa). */
export function createSimulationSession(
  scenarioType: string,
  maxTurns?: number,
): SimulationSession {
  return {
    scenarioType,
    maxTurns: maxTurns ?? maxTurnsFor(scenarioType),
    turnCount: 0,
    errors: [],
    history: [],
    situationRerolled: false,
  };
}

/** Incrementa el contador de turnos. */
export function recordTurn(session: SimulationSession): SimulationSession {
  return { ...session, turnCount: session.turnCount + 1 };
}

/** Agrega un error silencioso al búfer. */
export function recordError(
  session: SimulationSession,
  error: SilentError,
): SimulationSession {
  return { ...session, errors: [...session.errors, error] };
}

/** ¿Se agotó el presupuesto de turnos? */
export function isExhausted(session: SimulationSession): boolean {
  return session.turnCount >= session.maxTurns;
}

/** Agrega un mensaje al historial, recortando a los turnos más recientes. */
export function addTurn(
  session: SimulationSession,
  turn: ChatTurn,
): SimulationSession {
  return { ...session, history: capHistory([...session.history, turn]) };
}

/** Conserva sólo los MAX_HISTORY_TURNS turnos más recientes (par = 2 mensajes). */
export function capHistory(history: ChatTurn[]): ChatTurn[] {
  const max = MAX_HISTORY_TURNS * 2;
  return history.length > max ? history.slice(-max) : history;
}
