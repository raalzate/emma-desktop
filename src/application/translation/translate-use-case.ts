/**
 * Traducción bajo demanda del último turno. Orquestación pura: resuelve el
 * nombre del idioma destino, construye el prompt de dominio, llama al LLM por el
 * puerto inyectado y re-empareja la salida en pares bilingües de forma lenient.
 * Ante fallo del modelo devuelve pares vacíos en vez de lanzar.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import { TRANSLATION_MAX_TOKENS } from "@/domain/shared/token-budgets";
import { SUPPORTED_LANGUAGES } from "@/domain/translation/supported-language";
import {
  buildUserPrompt,
  pairLines,
  SYSTEM_PROMPT,
  type BilingualPair,
} from "@/domain/translation/translation-prompt";

// Acepta un código ("es") o ya el nombre en inglés; el prompt necesita el nombre.
function resolveLanguageName(targetLang: string): string {
  return SUPPORTED_LANGUAGES[targetLang]?.label ?? targetLang;
}

export async function translate(args: {
  llm: LlmGenerate;
  text: string;
  targetLang: string;
}): Promise<{ pairs: BilingualPair[] }> {
  try {
    const translated = await args.llm({
      prompt: buildUserPrompt(resolveLanguageName(args.targetLang), args.text),
      system: SYSTEM_PROMPT,
      maxTokens: TRANSLATION_MAX_TOKENS,
    });
    return { pairs: pairLines(translated) };
  } catch {
    return { pairs: [] };
  }
}
