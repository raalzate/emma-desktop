/**
 * Relaciona los errores capturados en sesión con COMMON_ERRORS (Apéndice E)
 * mediante match simple por texto: útil para reforzar la lección post-sesión
 * con el error frecuente que corresponde.
 */

import type { CommonError } from "@/domain/reference/reference";
import type { SilentError } from "@/domain/chat/silent-error";
import { COMMON_ERRORS } from "@/lib/reference-data/common-errors";

const DEFAULT_MAX_MATCHES = 3;

// Palabras de contenido (≥5 letras, sin contracciones): un umbral más alto que
// el anti-eco de coaching evita falsos positivos con palabras genéricas ("it's").
function contentWords(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-záéíóúñü]{5,}/g) ?? []);
}

function matchesError(commonError: CommonError, sessionWords: Set<string>): boolean {
  const errorWords = contentWords(`${commonError.wrong} ${commonError.right}`);
  for (const w of errorWords) if (sessionWords.has(w)) return true;
  return false;
}

/** Hasta `max` COMMON_ERRORS relevantes a los errores de la sesión (por texto). */
export function relevantCommonErrors(
  errors: SilentError[],
  max = DEFAULT_MAX_MATCHES,
): CommonError[] {
  const sessionWords = new Set(
    errors.flatMap((e) => [...contentWords(`${e.original} ${e.corrected}`)]),
  );
  if (sessionWords.size === 0) return [];
  return COMMON_ERRORS.filter((ce) => matchesError(ce, sessionWords)).slice(0, max);
}
