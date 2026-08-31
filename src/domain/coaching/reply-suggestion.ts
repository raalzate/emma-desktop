/**
 * Value object + prompt builders para el andamiaje de respuestas del aprendiz.
 *
 * Dos ayudas viven aquí: (1) chips de respuesta sugerida (3 continuaciones
 * escalonadas easy -> mid -> advanced) y (2) el autocompletado inline estilo
 * Gmail mientras el aprendiz teclea. Ambos prompts son de dominio puro: se
 * construyen aquí y se ejecutan vía el puerto LlmGenerate desde la aplicación.
 */

/** Orden fijo de las 3 sugerencias: la 1ª más simple, la 3ª más avanzada. */
export const LEVEL_HINTS = ["easy", "mid", "advanced"] as const;

export type LevelHint = (typeof LEVEL_HINTS)[number];

/** Una continuación corta que el aprendiz puede elegir en vez de teclear. */
export interface ReplySuggestion {
  text: string;
  levelHint: LevelHint;
}

// El system prompt se preserva VERBATIM del original Python (no traducir).
export const SUGGEST_REPLIES_SYSTEM_PROMPT =
  "You are a language coach inside a workplace English simulator. " +
  "Given the agent's last message, the agent's role, the user's CEFR level and the " +
  "active situation, produce exactly 3 short reply continuations the learner could send " +
  "next, ordered easy -> mid -> advanced. Each must be ≤18 words, natural, role-appropriate, " +
  "no lists, no quotes. Return ONLY a JSON array of 3 strings — no commentary.";

// VERBATIM: el completador mid-typing del reply parcial del aprendiz.
export const COMPLETE_PARTIAL_REPLY_SYSTEM_PROMPT =
  "You are a writing assistant. The learner is mid-typing an English reply in a " +
  "workplace simulation. Given the agent's last message + situation + their partial " +
  "sentence, produce up to 3 natural full-sentence completions that complete or " +
  "follow the partial text. Each ≤25 words. Return ONLY a JSON array of strings.";

// Apéndice SIEMPRE activo (BUG-001): el modelo pequeño devolvía como chips las
// preguntas del propio agente ("What is the progress?") en vez de respuestas
// del aprendiz. Se fija el lado de la conversación de forma explícita.
export const SUGGEST_REPLIES_ANSWER_RULES =
  " CRITICAL: the suggestions are what the LEARNER's side says next — first-person " +
  "answers TO the agent's last message, with concrete invented details when needed " +
  "(a task, a ticket, a date). Never echo the agent's wording back and never " +
  "produce the agent's own questions as suggestions.";

// Apéndice adicional (NO forma parte del prompt verbatim de Python): se
// concatena al system SOLO cuando el aprendiz ya tiene un borrador en el
// composer, para que las 3 sugerencias respeten su intención en vez de
// ignorarla (ver FR-004..006 de specs/002-chat-experience/spec.md).
export const SUGGEST_REPLIES_WITH_DRAFT_APPENDIX =
  " The learner has already started typing a draft reply, shown below. " +
  "The 3 suggestions must align with the draft's intent — completing it or " +
  "improving it while keeping the same intent — never contradicting it.";

/**
 * User prompt para las sugerencias: el CEFR guía el registro; `context` ya
 * empaqueta rol de EMMA, situación y su último turno tal como los ve el aprendiz.
 * Si `draft` viene no vacío, se añade la sección con el borrador actual del
 * aprendiz para que las sugerencias se generen alineadas a su intención.
 */
export function buildSuggestRepliesPrompt(context: string, level: string, draft?: string): string {
  const base = [`CEFR: ${level || "B1"}`, context].join("\n");
  const trimmedDraft = draft?.trim();
  if (!trimmedDraft) return base;
  return [
    base,
    `Learner's current draft: "${trimmedDraft}"`,
    "The 3 suggestions must align with the draft's intent (complete it or improve it, same intent), " +
      "keeping the easy -> mid -> advanced order.",
  ].join("\n");
}

// Palabras de contenido (≥4 letras) para medir eco contra el contexto del agente.
function contentWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-záéíóúñü']{4,}/g) ?? []).filter(Boolean);
}

/**
 * ¿Es la sugerencia un eco del agente? (BUG-001) Si casi todas sus palabras de
 * contenido ya están en el contexto (el último turno del agente), el chip no
 * aporta una respuesta del aprendiz: se descarta de forma determinista.
 */
export function isEchoOfAgent(suggestion: string, context: string): boolean {
  const words = contentWords(suggestion);
  if (words.length === 0) return false;
  const ctx = new Set(contentWords(context));
  const overlap = words.filter((w) => ctx.has(w)).length / words.length;
  // Una pregunta que repite al agente es eco casi seguro (el aprendiz debe
  // RESPONDER); una afirmación necesita solaparse casi por completo.
  const threshold = suggestion.trim().endsWith("?") ? 0.5 : 0.8;
  return overlap >= threshold;
}

/** User prompt para el autocompletado: contexto + el texto que va tecleando. */
export function buildCompletePartialReplyPrompt(context: string, partial: string): string {
  return [context, `Learner is typing: ${partial}`].join("\n");
}
