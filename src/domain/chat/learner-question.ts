/**
 * Pregunta directa del aprendiz (T11 de #323): «And you?», «What is your talk
 * about?». Medido en vivo: la persona la ignoraba y seguía con su propia
 * pregunta, que en una conversación real se lee como no escuchar. Dominio puro.
 */

/** Pedidos de aclaración: no son preguntas de contenido (los atiende la reparación). */
const META = /\b(what do you mean|can you repeat|repeat (that|please)|say (that|it) again|explain (it|that)|didn'?t understand|don'?t understand|sorry\?|pardon)\b/i;

/** Última oración interrogativa del mensaje del aprendiz, o null si no preguntó nada. */
export function learnerQuestionOf(message: string): string | null {
  const questions = message.match(/[^.!?]*\?/g);
  if (!questions) return null;
  const last = questions[questions.length - 1].trim();
  if (last.length < 3 || META.test(last)) return null;
  return last;
}

/** Orden de contestar primero: se antepone a la orden de contenido del turno. */
export function answerFirstCue(question: string): string {
  return (
    `ANSWER FIRST — they asked you: "${question}". Answer it briefly and in character ` +
    "(invent a plausible detail that fits the scene if needed), and only then continue."
  );
}
