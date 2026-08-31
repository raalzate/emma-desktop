/**
 * Capas de contexto del historial (BUG-001): no todo turno vale lo mismo.
 * Capa reciente = últimos turnos verbatim (continuidad inmediata). Capa vieja =
 * solo turnos sustantivos (los hechos ya viajan en el checklist de escena);
 * el smalltalk viejo se colapsa en una nota de una línea. Dominio puro.
 */

import type { ChatTurn } from "./simulation-session";
import { isSubstantive } from "./scene-state";

/** Turnos recientes que siempre viajan verbatim. */
const RECENT_TURNS = 4;

export interface LayeredHistory {
  /** Nota de compresión ("greetings and small talk"), o null si no se recortó. */
  note: string | null;
  turns: ChatTurn[];
}

/** Aplica las capas: recientes verbatim; viejos solo si sustantivos. */
export function layerHistory(history: ChatTurn[]): LayeredHistory {
  if (history.length <= RECENT_TURNS) return { note: null, turns: history };
  const older = history.slice(0, -RECENT_TURNS);
  const recent = history.slice(-RECENT_TURNS);
  const keptOlder = older.filter((t) => isSubstantive(t.content));
  const dropped = keptOlder.length < older.length;
  return {
    note: dropped ? "(Earlier: greetings and small talk were exchanged.)" : null,
    turns: [...keptOlder, ...recent],
  };
}
