/**
 * Juez tardío del turno.
 *
 * El "why": con IA local, el juez LLM (`observe`) corría ANTES de la respuesta
 * y sumaba ~2,2 s al 43 % de los turnos (5,6 s contra 3,4 s sin él; banco de
 * v0.13.0). Ahora la respuesta sale con la red determinista y el juez corre
 * después; lo que detectó y la red no se aplica al estado antes del turno
 * siguiente, así el checklist no queda atrás. Dominio puro.
 */

import { coverItem, type SceneState } from "./scene-state";
import type { TurnObservation } from "./turn-observation";

export function applyLateObservation(
  state: SceneState | null,
  judged: TurnObservation,
  message: string,
): SceneState | null {
  if (!state || judged.intent !== "in-scene" || !judged.answersItem) return state;
  return coverItem(state, judged.answersItem, message, { negative: judged.negative });
}
