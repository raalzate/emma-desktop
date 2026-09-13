/**
 * Recuperación ANCLADA al hilo (incidente: «pierde el hilo tan rápido»).
 *
 * El "why": cuando todas las generaciones de un turno salían inválidas, la
 * escena devolvía una línea amnésica («I lost my train of thought — where were
 * we?») aunque la app tenía el historial completo. Al aprendiz eso se le lee
 * como que la tutora olvidó la conversación. Con la pregunta que la persona
 * dejó abierta se puede retomar EXACTAMENTE donde estaba, sin inventar nada:
 * la recuperación deja de ser un reinicio y pasa a ser una reformulación.
 * Dominio puro: sólo texto.
 */

import { pickRecovery } from "./identity-guard";

/** Minúscula inicial para encajar la pregunta dentro de la frase de reparación. */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export interface GroundedRecoveryInput {
  /** Pregunta que la persona dejó abierta en su último turno, si la hubo. */
  openQuestion: string | null;
  /** Último turno de la persona: evita repetir la misma recuperación. */
  lastAssistantTurn: string;
}

/**
 * Retoma la pregunta abierta en palabras de reparación; sin pregunta abierta
 * cae a las variantes en personaje (que ya no repiten el turno anterior).
 */
export function buildGroundedRecovery(input: GroundedRecoveryInput): string {
  const question = input.openQuestion?.trim();
  if (question) return `Sorry, let me put it another way — ${lowerFirst(question)}`;
  return pickRecovery(input.lastAssistantTurn);
}
