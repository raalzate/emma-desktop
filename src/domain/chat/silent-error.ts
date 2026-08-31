/**
 * Una desviación gramatical capturada en silencio durante la simulación.
 *
 * `label` es la categoría enseñable (domain/chat/error-taxonomy) — alimenta el
 * histograma de patrones, los tips de la lección y el mapeo error→escenario.
 */

import type { ErrorLabel } from "./error-taxonomy";

export interface SilentError {
  label: ErrorLabel;
  original: string;
  corrected: string;
  /** Turno en que se capturó (opcional; lo usa el checker de gramática). */
  turn?: number;
}

// Meta-respuestas del checker que NO son correcciones ("no correction needed…").
const NON_CORRECTION =
  /no correction|no change|already correct|correct as is|nothing to correct|^n\/a$/i;

/**
 * ¿Es una corrección real y accionable? (BUG-001) El LLM a veces "corrige" con
 * una nota meta o devuelve el original intacto; eso no debe entrar al búfer ni
 * a la lección.
 */
export function isActionableCorrection(e: SilentError): boolean {
  const corrected = e.corrected.trim();
  if (!corrected || corrected === e.original.trim()) return false;
  if (NON_CORRECTION.test(corrected)) return false;
  if (/^\(.*\)$/.test(corrected)) return false; // paréntesis meta puro
  return true;
}
