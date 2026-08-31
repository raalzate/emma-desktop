/**
 * Chequeo de gramática SILENCIOSO por turno. El original usaba un modelo T5;
 * aquí lo reemplaza una única llamada estructurada al LlmGenerate (Gemma local)
 * que devuelve la frase corregida — o "OK" si ya estaba bien. Se hace diff
 * contra el original y, si cambió, se clasifica con classifyError y se emite un
 * SilentError. Mismo contrato de salida que antes: una lista de SilentError.
 *
 * Nunca se surface a media conversación: el buffer se guarda para la lección.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import { classifyError } from "@/domain/chat/error-taxonomy";
import type { SilentError } from "@/domain/chat/silent-grammar";

// System prompt VERBATIM en inglés. Redactado para intención de baja temperatura:
// determinista, conservador, sin explicaciones — el puerto LlmGenerate no expone
// un parámetro de temperatura, así que la instrucción la fija el prompt.
const GRAMMAR_SYSTEM_PROMPT =
  "You are a silent English grammar and spelling corrector. " +
  "Correct the learner's sentence into natural, standard English. " +
  "Preserve the original meaning and wording as much as possible — change only what is wrong. " +
  "Be deterministic and conservative: make the minimal correction, never rephrase for style. " +
  "If the sentence is already correct, reply with exactly OK. " +
  "Return ONLY the corrected sentence, with no quotes, no labels and no explanation.";

const ALREADY_CORRECT = "OK";

/** Limpia la respuesta del LLM: recorta espacios y comillas envolventes. */
function cleanCorrection(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "").trim();
}

export async function checkGrammar(args: {
  llm: LlmGenerate;
  text: string;
  turn: number;
}): Promise<SilentError[]> {
  const original = args.text.trim();
  if (!original) return [];

  const response = await args.llm({ prompt: original, system: GRAMMAR_SYSTEM_PROMPT });
  const corrected = cleanCorrection(response);

  // Sin cambios que capturar: LLM dijo "OK", devolvió vacío, o texto idéntico.
  if (!corrected || corrected === ALREADY_CORRECT || corrected === original) return [];

  const label = classifyError(original, corrected);
  return [{ label, original, corrected, turn: args.turn }];
}
