/**
 * Divide un mensaje inglés en oraciones completas para cubrir la pronunciación.
 *
 * Segmentamos de forma determinista en ORACIONES enteras (las comas quedan
 * dentro) para que la tabla de pronunciación cubra todo el vocabulario de la
 * salida de la IA con las menos filas posibles — una fila por oración. Solo una
 * oración desbocada de más de MAX_WORDS se sub-divide. No usa LLM.
 */

// Rompe solo en puntuación de fin de oración (no en comas) para que cada fila
// sea una oración entera — menos filas y más grandes.
const SENTENCE_BOUNDARY = /[.!?]+/;
export const MAX_WORDS = 16;
export const MAX_CHUNKS = 10; // cubre el mensaje entero; pocos turnos reales tienen más

/** Oraciones ordenadas y no vacías de a lo sumo `maxWords` palabras cada una. */
export function segmentForPronunciation(
  text: string,
  maxWords: number = MAX_WORDS,
): string[] {
  const chunks: string[] = [];
  for (const sentence of text.split(SENTENCE_BOUNDARY)) {
    const words = sentence.trim().split(/\s+/).filter((w) => w.length > 0);
    for (let start = 0; start < words.length; start += maxWords) {
      const chunk = words.slice(start, start + maxWords).join(" ").trim();
      // Solo filas con al menos una letra (descarta trozos de solo símbolos).
      if (chunk && /\p{L}/u.test(chunk)) {
        chunks.push(chunk);
      }
    }
  }
  return chunks.slice(0, MAX_CHUNKS);
}
