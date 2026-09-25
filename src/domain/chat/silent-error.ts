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

/**
 * Correcciones de superficie: el checker las devuelve igual que a las demás,
 * pero una mayúscula inicial o un punto final no enseñan nada. Fuera del
 * cierre, del histograma y de las recomendaciones (#170).
 */
const TRIVIAL_LABELS: ReadonlySet<ErrorLabel> = new Set([
  "punctuation",
  "capitalization",
  "spacing",
]);

export function isTrivialCorrection(label: ErrorLabel): boolean {
  return TRIVIAL_LABELS.has(label);
}

/**
 * EL criterio de «error de la sesión»: real (no meta) y enseñable (no trivial).
 * Se aplica una sola vez, en el borde donde entran al búfer — todo lo que
 * consume el búfer (resumen, lección, histograma, métricas, nivel) ve la misma
 * lista, para que no haya dos definiciones de error.
 */
export function reportableCorrections(errors: readonly SilentError[]): SilentError[] {
  return errors.filter((e) => isActionableCorrection(e) && !isTrivialCorrection(e.label));
}
