/**
 * Una desviación gramatical capturada en silencio durante la simulación.
 *
 * `label` es la categoría enseñable (domain/chat/error-taxonomy) — alimenta el
 * histograma de patrones, los tips de la lección y el mapeo error→escenario.
 */

import { ARTICLES, PREPOSITIONS, sameStem, tokens, wordDelta, type ErrorLabel } from "./error-taxonomy";
import { IRREGULAR_VERBS } from "@/lib/reference-data/irregular-verbs";
import { editDistance } from "@/domain/exercises/answer-diagnosis";

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
  if (/\[[^\]]+\]/.test(corrected)) return false; // marcador del modelo: [service/resource]
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
 * Palabras de función: si la corrección toca una, es gramática (auxiliar,
 * artículo, preposición, pronombre…), nunca un cambio de vocabulario.
 */
const FUNCTION_WORDS: ReadonlySet<string> = new Set([
  ...ARTICLES,
  ...PREPOSITIONS,
  "am", "is", "are", "was", "were", "be", "been", "being",
  "do", "does", "did", "don't", "doesn't", "didn't", "dont", "doesnt", "didnt",
  "have", "has", "had", "haven't", "hasn't", "hadn't",
  "will", "would", "can", "could", "should", "shall", "must", "may", "might",
  "won't", "wouldn't", "can't", "couldn't", "shouldn't", "not", "no",
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their", "this", "that", "these", "those",
  "and", "or", "but", "so", "if", "than", "then", "as", "very", "much", "many", "some", "any",
]);

/** go/went/gone son la misma palabra: familias del apéndice de verbos irregulares. */
const IRREGULAR_FAMILY: ReadonlyMap<string, number> = new Map(
  IRREGULAR_VERBS.flatMap((v, i) =>
    [v.base, v.past, v.participle].flatMap((form) => form.split("/").map((f) => [f.trim().toLowerCase(), i] as const)),
  ),
);

/** Hasta dos letras de diferencia: ortografía de la misma palabra (recieved → received). */
const SPELLING_MAX = 2;

function related(a: string, b: string): boolean {
  if (sameStem(a, b)) return true;
  if (editDistance(a, b) <= SPELLING_MAX) return true;
  const fa = IRREGULAR_FAMILY.get(a);
  return fa !== undefined && fa === IRREGULAR_FAMILY.get(b);
}

/** Más de la mitad de las palabras originales desaparecieron: se reescribió, no se corrigió. */
const REWRITE_RATIO = 0.5;
/** En frases de menos palabras la proporción no dice nada (Nathing → Nothing). */
const REWRITE_MIN_WORDS = 4;

/**
 * ¿El corrector reformuló en vez de corregir? Dos señales: (a) cambió palabras
 * de contenido por otras sin relación (issues → tasks: un sinónimo no es un
 * error), o (b) reescribió más de la mitad de la frase. Un modelo pequeño hace
 * esto a veces aunque se le pida la corrección mínima; si entra a la lección
 * y a las tarjetas, enseña una «corrección» falsa.
 */
export function isRephrase(e: Pick<SilentError, "original" | "corrected">): boolean {
  const { removed, added } = wordDelta(e.original, e.corrected);
  if (removed.length === 0) return false;
  const originalCount = tokens(e.original).length;
  if (originalCount >= REWRITE_MIN_WORDS && removed.length / originalCount > REWRITE_RATIO) return true;
  // Sólo borró (API contract → API; nothing for now → Nothing.): si se llevó
  // contenido, no corrigió nada; si sólo quitó palabras de función, sí (I am agree → I agree).
  if (added.length === 0) return removed.some((w) => !FUNCTION_WORDS.has(w));
  const changed = [...removed, ...added];
  if (changed.some((w) => FUNCTION_WORDS.has(w))) return false;
  return removed.every((r) => !added.some((a) => related(r, a)));
}

/**
 * EL criterio de «error de la sesión»: real (no meta), enseñable (no trivial) y
 * una corrección de verdad (no una reformulación).
 * Se aplica una sola vez, en el borde donde entran al búfer — todo lo que
 * consume el búfer (resumen, lección, histograma, métricas, nivel) ve la misma
 * lista, para que no haya dos definiciones de error.
 */
export function reportableCorrections(errors: readonly SilentError[]): SilentError[] {
  return errors.filter((e) => isActionableCorrection(e) && !isTrivialCorrection(e.label) && !isRephrase(e));
}
