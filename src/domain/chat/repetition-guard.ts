/**
 * Guardia anti-repetición de opener (BUG-001): el modelo local abre turnos
 * consecutivos con la misma muletilla ("Great, so far so good!…"). Una persona
 * real no se repite; si el opener coincide con el de un turno anterior de la
 * persona, se extirpa de forma determinista. Dominio puro: solo texto.
 */

const OPENER_KEY_WORDS = 4;

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?…])\s+/)[0] ?? "";
}

/** Clave de comparación: primeras N palabras normalizadas de la oración. */
function openerKey(sentence: string): string {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, OPENER_KEY_WORDS)
    .join(" ");
}

/**
 * Si la respuesta abre igual que un turno anterior de la persona, elimina ese
 * opener (hasta 2 oraciones encadenadas). Si todo era repetición devuelve
 * cadena vacía: el caller decide el reemplazo en personaje.
 */
export function stripRepeatedOpener(
  text: string,
  previousAssistantTurns: readonly string[],
): string {
  if (previousAssistantTurns.length === 0) return text;
  const seen = new Set(
    previousAssistantTurns.map((t) => openerKey(firstSentence(t))).filter(Boolean),
  );
  let out = text.trim();
  for (let i = 0; i < 2; i++) {
    const first = firstSentence(out);
    const key = openerKey(first);
    if (!key || !seen.has(key)) break;
    out = out.slice(first.length).trim();
  }
  return out;
}

function questionsOf(text: string): string[] {
  return (text.match(/[^.!?]*\?/g) ?? []).map((q) => q.trim()).filter(Boolean);
}

function contentWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9'\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  for (const w of a) if (b.has(w)) common += 1;
  return common / Math.min(a.size, b.size);
}

/** Cuántas líneas propias recientes se miran: la repetición que molesta es la inmediata. */
const OWN_QUESTION_WINDOW = 2;

/**
 * ¿La respuesta repite una pregunta que la persona hizo en sus dos últimas
 * líneas? (T13 de #323). Medido en el banco: «Which part … took you the
 * longest?» se repetía aunque el aprendiz ya hubiera cambiado de tema. El
 * caller la trata como respuesta inválida y reintenta con otras palabras.
 */
export function repeatsOwnQuestion(reply: string, previousAssistantTurns: readonly string[]): boolean {
  const recent = recentQuestionWords(previousAssistantTurns);
  return questionsOf(reply).some((q) => isRepeatedQuestion(q, recent));
}

function recentQuestionWords(previousAssistantTurns: readonly string[]): Set<string>[] {
  return previousAssistantTurns.slice(-OWN_QUESTION_WINDOW).flatMap(questionsOf).map(contentWords);
}

function isRepeatedQuestion(question: string, recent: readonly Set<string>[]): boolean {
  const words = contentWords(question);
  return words.size >= 2 && recent.some((r) => overlap(words, r) >= 0.8);
}

/**
 * Quita de la respuesta SÓLO las preguntas que repiten una de las dos últimas
 * líneas de la persona y conserva el resto (la reacción a lo que dijo el
 * aprendiz). Medido en el banco: rechazar la línea entera llevaba a un
 * reintento que repetía igual y a la continuación neutral. Vacío ⇒ no quedó nada.
 */
export function stripRepeatedQuestions(reply: string, previousAssistantTurns: readonly string[]): string {
  const recent = recentQuestionWords(previousAssistantTurns);
  const sentences = reply.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) ?? [reply];
  return sentences
    .filter((s) => !(s.trim().endsWith("?") && isRepeatedQuestion(s, recent)))
    .join("")
    .trim();
}
