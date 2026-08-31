/**
 * Convierte texto de burbuja a una versión "hablable" para TTS: elimina
 * emojis, comillas, paréntesis y símbolos decorativos que Edge-TTS pronuncia
 * literalmente, conservando puntuación natural, contracciones y números.
 */

// Emojis y pictogramas: rango Extended_Pictographic + banderas (Regional_Indicator)
// + selector de variación (FE0F), ZWJ (200D) y encapsulado de keycap (20E3).
const EMOJI_RE = /[\p{Extended_Pictographic}\p{Regional_Indicator}️‍⃣]/gu;
// Comillas dobles (rectas y tipográficas), simples tipográficas y guillemets.
const QUOTE_RE = /["“”‘’«»]/g;
// Comilla recta (') SOLO como apóstrofe de contracción cuando va entre letras
// (don't, it's); como marca de cita ('hi') se elimina igual que las demás.
const STRAIGHT_SINGLE_QUOTE_RE = /(?<![A-Za-z])'|'(?![A-Za-z])/g;
// Paréntesis/corchetes/llaves: se elimina el carácter, se conserva el contenido.
const BRACKET_RE = /[()[\]{}]/g;
// Guion largo/corto siempre decorativo.
const EM_EN_DASH_RE = /[–—]/g;
// Guion(es) sueltos rodeados de espacio (o al inicio/fin): "- ", " -- ", etc.
// No afecta palabras compuestas como "well-known" (sin espacio alrededor).
const LONE_HYPHEN_RE = /(^|\s)-+(?=\s|$)/g;
// Símbolos decorativos: asteriscos (énfasis markdown), almohadilla, virgulilla, bullet.
const DECORATIVE_SYMBOL_RE = /[*#~•]/g;
const SPACE_BEFORE_PUNCT_RE = /\s+([.,;:!?])/g;

/** Limpia el texto de lo no pronunciable, dejando puntuación y números naturales. */
export function toSpeakable(text: string): string {
  const withoutEmoji = text.replace(EMOJI_RE, " ");
  const withoutQuotes = withoutEmoji
    .replace(QUOTE_RE, "")
    .replace(STRAIGHT_SINGLE_QUOTE_RE, "");
  const withoutBrackets = withoutQuotes.replace(BRACKET_RE, "");
  const withoutDashes = withoutBrackets
    .replace(EM_EN_DASH_RE, " ")
    .replace(LONE_HYPHEN_RE, "$1 ");
  const withoutSymbols = withoutDashes.replace(DECORATIVE_SYMBOL_RE, " ");
  const collapsedSpaces = withoutSymbols.replace(/\s+/g, " ");
  const noSpaceBeforePunct = collapsedSpaces.replace(SPACE_BEFORE_PUNCT_RE, "$1");
  return noSpaceBeforePunct.trim();
}

/** True si tras limpiar queda alguna letra o dígito (texto realmente hablable). */
export function hasSpeakableContent(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(toSpeakable(text));
}
