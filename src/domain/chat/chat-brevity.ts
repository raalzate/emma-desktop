/**
 * Recorte de brevedad para las respuestas de EMMA en simulación (dominio puro).
 *
 * El modelo local a veces emite meta-monólogo del proceso de redacción
 * ("My interpretation of the situation:", listas numeradas de plantilla,
 * "(Final Answer)") en vez de responder directamente en el rol conversacional.
 * Este módulo filtra ese ruido y limita la respuesta a un número corto de
 * oraciones, preservando una pregunta final si existía, para que EMMA siga
 * tirando de la conversación del usuario.
 */

// Abreviaturas de una sola palabra que terminan en "." pero no cierran oración.
const WORD_ABBREVIATIONS = ["mr", "mrs", "ms", "dr", "prof", "sr", "jr", "vs", "etc"];

// Marcador temporal para "proteger" puntos que no cierran oración (abreviaturas/decimales).
const DOT_GUARD = String.fromCharCode(1);
const DOT_GUARD_PATTERN = new RegExp(DOT_GUARD, "g");

/** Cierre de comillas/paréntesis que puede seguir inmediatamente al signo de puntuación. */
const TRAILING_CLOSERS = new Set(['"', "'", "”", "’", ")", "`"]);

/** Reemplaza los puntos de decimales y abreviaturas conocidas por un marcador protegido. */
function protectNonSentenceDots(text: string): string {
  let protectedText = text.replace(/(\d)\.(\d)/g, `$1${DOT_GUARD}$2`);
  const wordPattern = new RegExp(`\\b(${WORD_ABBREVIATIONS.join("|")})\\.`, "gi");
  protectedText = protectedText.replace(wordPattern, (_match, word: string) => `${word}${DOT_GUARD}`);
  protectedText = protectedText.replace(/\b(e\.g|i\.e)\./gi, (match) => match.replace(/\./g, DOT_GUARD));
  return protectedText;
}

/** Restaura los puntos protegidos a su forma original. */
function unprotectDots(text: string): string {
  return text.replace(DOT_GUARD_PATTERN, ".");
}

/**
 * Segmenta `text` en oraciones terminadas en . ! ? (tolerando cierres de
 * comillas/paréntesis adyacentes). No parte en abreviaturas ni decimales.
 * La última oración sin puntuación final también se conserva.
 */
export function splitSentences(text: string): string[] {
  const protectedText = protectNonSentenceDots(text);
  const sentences: string[] = [];
  let start = 0;
  for (let i = 0; i < protectedText.length; i++) {
    const char = protectedText[i];
    if (char !== "." && char !== "!" && char !== "?") continue;
    let end = i + 1;
    // Absorbe cierres de comillas/paréntesis inmediatamente después del signo.
    while (end < protectedText.length && TRAILING_CLOSERS.has(protectedText[end])) end++;
    const sentence = unprotectDots(protectedText.slice(start, end).trim());
    if (sentence.length > 0) sentences.push(sentence);
    start = end;
  }
  const rest = unprotectDots(protectedText.slice(start).trim());
  if (rest.length > 0) sentences.push(rest);
  return sentences;
}

/** Patrones de auto-referencia al proceso de redacción del modelo (meta-monólogo). */
const META_SENTENCE_PATTERNS: RegExp[] = [
  /my interpretation of the situation/i,
  /my goal is to help you/i,
  /i've refined the language/i,
  /i'll rephrase the request/i,
  /what i've understood so far is/i,
  /a more professional and structured version/i,
  /the final answer is the one above/i,
  /\bfinal answer\b/i,
  /refine|rephrase|structure the response/i,
  /i'?m assuming you meant/i,
  /let'?s proceed with the assumption/i,
  /adjust the (language|tone|wording|response)/i,
  /^\d+\.\s*\(\s*[^)]*\)\s*$/i, // "1. (Current State)", "6. ( )" como oración completa
  // Muñones de lista numerada sin contenido: "1.", "What 2.", "2" (BUG-001).
  /^(?:\d+\.?|[a-z]{1,12}\s+\d+\.?)$/i,
];

/** Marcadores/placeholders que se eliminan aunque estén incrustados dentro de una oración. */
const INLINE_NOISE_PATTERNS: RegExp[] = [
  /\d+\.\s*\([^)]{0,60}\)/g, // listas numeradas de plantilla: "1. (Current State)"
  /\(\s*final answer\s*\)/gi,
  /\(\s*the final answer is the one above\s*\)/gi,
  /\[a more professional and structured version of the above\]/gi,
  // Paréntesis de auto-instrucción: "(I'll adjust the tone/complexity of the
  // response...)" — el modelo piensa en voz alta sobre CÓMO redactar. Exige
  // "I'll/I will" + vocabulario de redacción para no tocar paréntesis legítimos.
  /\((?=[^)]*\b(?:i'?ll|i will|i'?m going to)\b)(?=[^)]*\b(?:tone|response|language|complexity|wording|register|adjust\w*|rephras\w*|simplif\w*)\b)[^)]*\)/gi,
  // Meta-análisis de lo que el usuario "quiso decir": "(I'm assuming you meant...)".
  /\((?=[^)]*\b(?:i'?m assuming|you meant|let'?s proceed with the assumption)\b)[^)]*\)/gi,
  // Corchetes condicionales de plantilla: "[If you are the one who...]". En una
  // conversación real no hay corchetes largos legítimos.
  /\[[^\]\n]{0,160}\]/g,
  // Andamiaje de etiquetas del proceso de redacción (BUG-001): el modelo
  // intercala rótulos tipo "What I need to know:", "Goal:", "(now)".
  /\bwhat i need to know:\s*/gi,
  /\bgoal:\s*/gi,
  /\(\s*now\s*\)/gi,
  // Paréntesis de planificación de la conversación: "(Here is the next step in
  // the conversation, where I'll focus on…)" (BUG-001).
  /\((?=[^)]*\b(?:here is|i'?ll focus|the conversation|next step)\b)[^)]*\)/gi,
];

/** Elimina marcadores de plantilla incrustados dentro de una misma oración. */
function stripInlineNoise(text: string): string {
  return INLINE_NOISE_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, " "), text);
}

/** Indica si un fragmento coincide con algún patrón de meta-monólogo completo. */
function isMetaSentence(sentence: string): boolean {
  return META_SENTENCE_PATTERNS.some((pattern) => pattern.test(sentence));
}

/**
 * Elimina oraciones/segmentos que matcheen meta-monólogo del modelo
 * (interpretación de la situación, refinamiento del lenguaje, listas de
 * plantilla numeradas, marcador de respuesta final). No borra contenido
 * conversacional legítimo.
 */
export function stripMetaText(text: string): string {
  const withoutInlineNoise = stripInlineNoise(text);
  const kept = splitSentences(withoutInlineNoise).filter((sentence) => !isMetaSentence(sentence));
  return kept.join(" ").replace(/\s{2,}/g, " ").trim();
}

/** Indica si una oración es una pregunta (termina en "?"). */
function isQuestion(sentence: string): boolean {
  return sentence.trim().endsWith("?");
}

/**
 * Conserva las primeras `max` oraciones completas de `text`. Si entre las
 * descartadas hay una pregunta y ninguna de las conservadas es pregunta,
 * sustituye la última conservada por la primera pregunta descartada (EMMA
 * debe terminar tirando del usuario).
 */
export function capSentences(text: string, max: number): string {
  const sentences = splitSentences(text);
  if (sentences.length <= max) return sentences.join(" ");
  const kept = sentences.slice(0, max);
  const discarded = sentences.slice(max);
  if (!kept.some(isQuestion)) {
    const firstDiscardedQuestion = discarded.find(isQuestion);
    if (firstDiscardedQuestion) {
      kept[kept.length - 1] = firstDiscardedQuestion;
    }
  }
  return kept.join(" ");
}

/** Colapsa espacios repetidos y recorta bordes. */
function collapseWhitespace(text: string): string {
  return text.replace(/[ \t]{2,}/g, " ").replace(/\n{2,}/g, "\n").trim();
}

// Tope duro de palabras: los run-ons sin puntuación burlan el tope de
// oraciones (BUG-001). Se corta en la última frontera de oración dentro del
// presupuesto o, si no la hay, en seco con elipsis.
const MAX_REPLY_WORDS = 60;

function capWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  const sentences = splitSentences(text);
  const kept: string[] = [];
  let budget = maxWords;
  for (const s of sentences) {
    const n = s.split(/\s+/).length;
    if (n > budget) break;
    kept.push(s);
    budget -= n;
  }
  if (kept.length > 0) return kept.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/**
 * Compone el pipeline de brevedad: filtra meta-monólogo, limita a `max`
 * oraciones y a un tope duro de palabras, y normaliza espacios. Punto de
 * integración único para el caso de uso de chat.
 */
export function polishChatReply(raw: string, max = 3): string {
  const withoutMeta = stripMetaText(raw);
  const capped = capWords(capSentences(withoutMeta, max), MAX_REPLY_WORDS);
  return collapseWhitespace(capped);
}
