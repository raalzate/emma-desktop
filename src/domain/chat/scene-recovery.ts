/**
 * Continuación neutral cuando las dos generaciones del turno salieron
 * inválidas (T7 de #323).
 *
 * El "why": la recuperación anterior retomaba «la pregunta abierta» («Sorry,
 * let me put it another way — what did you do yesterday?») justo cuando el
 * aprendiz ACABABA de contestarla: se leía como que la persona no escuchó. Y
 * las variantes en personaje eran del standup («anything blocking you?») aunque
 * la escena fuera otra. Una continuación neutral acusa recibo y devuelve el
 * turno sin re-preguntar ni declarar amnesia, en cualquier escena. Dominio puro.
 */

const CONTINUATIONS: readonly string[] = [
  "Got it. Tell me a bit more about that.",
  "Okay, I see. Go on.",
  "Right, that makes sense. What else?",
];

/** Continuación que NO repite el último turno de la persona. */
export function neutralContinuation(lastAssistantTurn: string): string {
  const last = lastAssistantTurn.trim();
  return CONTINUATIONS.find((c) => c !== last) ?? CONTINUATIONS[0];
}
