/**
 * Capas de contexto del historial (BUG-001): no todo turno vale lo mismo.
 * Capa reciente = últimos turnos verbatim (continuidad inmediata). Capa vieja =
 * solo turnos sustantivos (los hechos ya viajan en el checklist de escena);
 * el smalltalk viejo se colapsa en una nota de una línea. Dominio puro.
 *
 * Con un TOPE duro además del filtro: en una escena larga todos los turnos
 * viejos pueden ser sustantivos, así que filtrar smalltalk no acotaba nada y el
 * prompt crecía turno a turno. Lo concreto que se pierde al recortar no se
 * pierde de verdad: viaja en la memoria de escena (ver scene-memory).
 */

import type { ChatTurn } from "./simulation-session";
import { isSubstantive } from "./scene-state";

/** Turnos recientes que siempre viajan verbatim. */
const RECENT_TURNS = 4;

/** Turnos viejos que sobreviven al recorte, como mucho. */
const MAX_OLDER_TURNS = 4;

export interface LayeredHistory {
  /** Nota de compresión ("greetings and small talk"), o null si no se recortó. */
  note: string | null;
  turns: ChatTurn[];
}

const NOTE_SMALLTALK = "(Earlier: greetings and small talk were exchanged.)";
const NOTE_TRIMMED = "(Earlier turns are summarised away; the details you need are listed above.)";

/** Aplica las capas: recientes verbatim; viejos sólo si sustantivos y acotados. */
export function layerHistory(history: ChatTurn[]): LayeredHistory {
  if (history.length <= RECENT_TURNS) return { note: null, turns: history };
  const older = history.slice(0, -RECENT_TURNS);
  const recent = history.slice(-RECENT_TURNS);
  const substantive = older.filter((t) => isSubstantive(t.content));
  // Se recortan los MÁS VIEJOS: lo cercano al turno actual es lo que sostiene
  // el hilo de la conversación.
  const keptOlder = substantive.slice(-MAX_OLDER_TURNS);
  const droppedSmalltalk = substantive.length < older.length;
  const droppedByCap = keptOlder.length < substantive.length;
  return {
    note: droppedByCap ? NOTE_TRIMMED : droppedSmalltalk ? NOTE_SMALLTALK : null,
    turns: [...keptOlder, ...recent],
  };
}
