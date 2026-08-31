/**
 * Clasifica una corrección del checker de gramática en una categoría enseñable.
 *
 * Las etiquetas alimentan los tips de la lección post-sesión y el mapeo
 * error→escenario de práctica (domain/pathway/error-scenario-mapping) — mantener
 * los tres en sincronía.
 */

export type ErrorLabel =
  | "article"
  | "preposition"
  | "word_form"
  | "word_order"
  | "punctuation"
  | "capitalization"
  | "spacing"
  | "grammar";

const STRIP_PUNCT = /[.,;:!?¿¡]/g;
const ARTICLES = new Set(["a", "an", "the"]);
const PREPOSITIONS = new Set([
  "in", "on", "at", "to", "for", "of", "with", "by", "from", "about",
  "into", "over", "under", "after", "before", "during", "between",
  "against", "since", "until", "through",
]);

function tokens(text: string): string[] {
  return text.replace(STRIP_PUNCT, "").toLowerCase().split(/\s+/).filter(Boolean);
}

/** go/goes, task/tasks, want/wanted — una palabra es extensión corta de la otra. */
function sameStem(a: string, b: string): boolean {
  const [short, longer] = a.length <= b.length ? [a, b] : [b, a];
  return longer.startsWith(short) || a.slice(0, 3) === b.slice(0, 3);
}

/** Multiconjunto: cuenta de cada token. */
function counter(items: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
  return m;
}

/** a - b sobre multiconjuntos (tokens con conteo positivo restante). */
function subtract(a: Map<string, number>, b: Map<string, number>): string[] {
  const out: string[] = [];
  for (const [k, n] of a) {
    const rem = n - (b.get(k) ?? 0);
    for (let i = 0; i < rem; i++) out.push(k);
  }
  return out;
}

function isWordForm(removed: string[], added: string[]): boolean {
  if (!removed.length || !added.length) return false;
  return removed.every((r) => added.some((a) => sameStem(r, a)));
}

function isSubset(small: Set<string>, big: Set<string>): boolean {
  for (const x of small) if (!big.has(x)) return false;
  return true;
}

function wordLevelLabel(original: string, corrected: string): ErrorLabel {
  const orig = tokens(original);
  const corr = tokens(corrected);
  const removed = subtract(counter(orig), counter(corr));
  const added = subtract(counter(corr), counter(orig));
  const changed = new Set([...removed, ...added]);
  if (changed.size === 0) {
    return orig.join(" ") !== corr.join(" ") ? "word_order" : "grammar";
  }
  if (isSubset(changed, ARTICLES)) return "article";
  if (isSubset(changed, PREPOSITIONS)) return "preposition";
  if (isWordForm(removed, added)) return "word_form";
  return "grammar";
}

/** Clasifica una corrección: primero superficie, luego análisis por palabra. */
export function classifyError(original: string, corrected: string): ErrorLabel {
  const strip = (s: string) => s.replace(STRIP_PUNCT, "").toLowerCase();
  const collapse = (s: string) => s.split(/\s+/).filter(Boolean).join(" ");
  if (original.toLowerCase() === corrected.toLowerCase()) return "capitalization";
  if (collapse(original) === collapse(corrected)) return "spacing";
  if (strip(original) === strip(corrected)) return "punctuation";
  return wordLevelLabel(original, corrected);
}
