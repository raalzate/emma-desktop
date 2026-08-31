/**
 * Plantilla del prompt de traducción + post-procesado de la salida.
 * El modelo traduce frase por frase y devuelve pares bilingües (original /
 * traducción). El re-emparejado en código tolera que el LLM pequeño meta líneas
 * en blanco de más entre frase y traducción.
 */

// System prompt preservado VERBATIM del original Python (no traducir).
export const SYSTEM_PROMPT =
  "You are a professional translator. " +
  "Translate the user's text into the requested language sentence by sentence. " +
  "For each English sentence, output exactly:\n" +
  "- line 1: the English sentence\n" +
  "- line 2: the translation\n" +
  "- a single blank line as separator before the next pair.\n" +
  "Do NOT insert blank lines between the English sentence and its translation. " +
  "Output ONLY the pairs — no labels, no explanations, no extra text.";

/** User prompt: instrucción + texto a traducir (VERBATIM). */
export function buildUserPrompt(targetLanguageName: string, text: string): string {
  return `Translate to ${targetLanguageName}:\n${text}`;
}

/** Par bilingüe: frase original y su traducción. */
export interface BilingualPair {
  source: string;
  target: string;
}

/**
 * Re-empareja líneas no vacías alternas en pares (original, traducción).
 * Idempotente: pares correctos pasan tal cual; salida con línea en blanco por
 * cada renglón se reagrupa en bloques de a dos. Una línea suelta final se
 * empareja con "".
 */
export function pairLines(raw: string): BilingualPair[] {
  const lines = raw
    .split(/\r?\n/)
    .map((ln) => ln.trim())
    .filter((ln) => ln.length > 0);
  const pairs: BilingualPair[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    pairs.push({ source: lines[i], target: lines[i + 1] ?? "" });
  }
  return pairs;
}
