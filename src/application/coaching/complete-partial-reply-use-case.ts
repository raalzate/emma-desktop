/**
 * Autocompletado inline estilo Gmail para el reply que el aprendiz teclea.
 * El LLM propone hasta 3 frases completas; para el typeahead solo mostramos la
 * *continuación* (el texto en gris tras el cursor), así que recortamos el
 * prefijo ya escrito de la primera propuesta válida. Orquestación pura.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import { isNonEmptyString, parseRawArray } from "@/domain/coaching/parse-json-array";
import {
  buildCompletePartialReplyPrompt,
  COMPLETE_PARTIAL_REPLY_SYSTEM_PROMPT,
} from "@/domain/coaching/reply-suggestion";

// El original usa 180 tokens para el completador (no hay presupuesto compartido).
const COMPLETION_MAX_TOKENS = 180;
const MAX_COMPLETIONS = 3;

/** Primera propuesta no vacía de hasta 3; "" si el LLM no devuelve nada usable. */
function firstCompletion(raw: string): string {
  const found = parseRawArray(raw).slice(0, MAX_COMPLETIONS).find(isNonEmptyString);
  return found ? found.trim() : "";
}

// Devuelve solo lo que sigue al texto ya tecleado; si la frase no empieza por
// el parcial (el modelo pequeño a veces reescribe), devolvemos la frase entera.
function continuationOf(partial: string, completion: string): string {
  const prefix = partial.trimStart();
  if (prefix && completion.toLowerCase().startsWith(prefix.toLowerCase())) {
    return completion.slice(prefix.length);
  }
  return completion;
}

export async function completePartialReply(args: {
  llm: LlmGenerate;
  context: string;
  partial: string;
}): Promise<string> {
  const raw = await args.llm({
    prompt: buildCompletePartialReplyPrompt(args.context, args.partial),
    system: COMPLETE_PARTIAL_REPLY_SYSTEM_PROMPT,
    maxTokens: COMPLETION_MAX_TOKENS,
  });
  const completion = firstCompletion(raw);
  return completion ? continuationOf(args.partial, completion) : "";
}
