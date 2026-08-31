/**
 * La ÚNICA orden de contenido que recibe la persona en un turno.
 *
 * El "why": cada mejora fue añadiendo su propia directiva y todas se
 * concatenaban — "pregunta SOLO por el plan de hoy" + "pide un detalle sin
 * cambiar de tema" + "no hagas más preguntas, cierra". Son órdenes
 * incompatibles; el modelo pequeño se rendía y devolvía un "Great!" vacío.
 * Aquí se elige UNA sola por prioridad: cerrar > pedir detalle > profundizar >
 * preguntar el siguiente tema. El recast se anexa aparte porque es de forma
 * (cómo decirlo), no de contenido (qué preguntar). Dominio puro.
 */

import { WRAP_UP_CUE } from "./scene-closing";
import { sceneDirective, type SceneState } from "./scene-state";

export interface TurnDirectiveInput {
  state: SceneState | null;
  /** La respuesta fue mínima: toca pedir un detalle antes de avanzar. */
  elaborate: boolean;
  /** Checklist cubierto demasiado pronto: profundizar en vez de cerrar. */
  deepen: boolean;
  /** Borde del presupuesto de turnos: la escena debe cerrarse. */
  wrapUp: boolean;
  /** Directiva de recast ya construida (puede venir vacía). */
  recastCue: string;
}

/** Contexto de lo ya sabido, para no repreguntarlo aunque cambie la orden. */
function knownFacts(state: SceneState | null): string {
  if (!state || state.covered.length === 0) return "";
  const known = state.covered.map((c) => `${c.id}: "${c.fact}"`).join("; ");
  return `You already know — ${known}. Do NOT ask about those again. `;
}

const ELABORATE_CUE =
  "React to their last answer and ask ONE specific follow-up for a concrete " +
  "detail about that same thing. Do NOT move to a new topic yet.";

export function buildTurnDirective(input: TurnDirectiveInput): string {
  const { state, elaborate, deepen, wrapUp, recastCue } = input;
  const order = (() => {
    if (wrapUp) return `${knownFacts(state)}${WRAP_UP_CUE}`;
    if (elaborate) return `${knownFacts(state)}${ELABORATE_CUE}`;
    if (state) return sceneDirective(state, { deepen });
    return "";
  })();
  return [order, recastCue].filter(Boolean).join(" ");
}
