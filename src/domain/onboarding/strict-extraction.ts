/**
 * Extracción estricta para la red del onboarding agéntico (dominio puro).
 *
 * `comprehend-prompts.ts` es un port verbatim que ASUME que la frase contiene
 * el dato y cae al texto crudo si no logra extraerlo: sirve para el motor por
 * pasos, donde la pregunta y la respuesta van pegadas. La red del flujo ReAct
 * necesita lo contrario — poder decir "acá no hay nada" — porque el aprendiz
 * puede haber contestado otra cosa. Sin esa negativa, la respuesta a "cuál es
 * tu cargo" termina guardada como "qué querés practicar".
 */

import { STEP_SCHEMAS } from "@/domain/onboarding/step-extraction-schema";

/** Sentinela que el modelo debe emitir cuando el texto no trae el dato. */
export const STRICT_NONE = "NONE";

const SYSTEM_TEMPLATE =
  "You are a strict data extraction assistant. " +
  "The user text may or may not contain {description}. " +
  "The text may not contain it at all — in that case respond with exactly " +
  `${STRICT_NONE}. ` +
  "If it does contain it, respond with only that value — no explanation, no " +
  "punctuation, no extra words. Never repeat the whole text back. " +
  "Constraints: {constraints}.";

const USER_TEMPLATE =
  "Does the following text contain {description}?\n" +
  "Text: {raw}\n" +
  `Output only the extracted value, or ${STRICT_NONE}.`;

/** Prompts de extracción estricta para un paso del onboarding. */
export function buildStrictPrompts(step: string, raw: string): { system: string; user: string } {
  const schema = STEP_SCHEMAS[step];
  if (!schema) throw new Error(`paso desconocido para extracción estricta: ${step}`);
  const system = SYSTEM_TEMPLATE.replaceAll("{description}", schema.description).replace(
    "{constraints}",
    schema.constraints,
  );
  const user = USER_TEMPLATE.replace("{description}", schema.description).replace("{raw}", raw);
  return { system, user };
}

/** Palabras a partir de las cuales un eco literal delata copia, no extracción. */
const ECHO_WORD_THRESHOLD = 4;

/** Normaliza la salida del extractor estricto: null cuando no hay dato usable. */
export function parseStrictValue(response: string, rawUser?: string): string | null {
  const cleaned = response.trim().replace(/^["'`]+|["'`.]+$/g, "").trim();
  if (cleaned.length < 2) return null;
  if (cleaned.toUpperCase() === STRICT_NONE) return null;
  if (rawUser && isSuspiciousEcho(cleaned, rawUser)) return null;
  return cleaned;
}

/**
 * Eco sospechoso: el modelo devolvió el texto entero del aprendiz. Solo cuenta
 * como copia si ese texto era una frase — cuando la respuesta ES el dato
 * ("Raul", "Solutions Architect") el eco es la extracción correcta.
 */
function isSuspiciousEcho(value: string, rawUser: string): boolean {
  const raw = rawUser.trim();
  if (value.toLowerCase() !== raw.toLowerCase()) return false;
  return raw.split(/\s+/).filter(Boolean).length >= ECHO_WORD_THRESHOLD;
}
