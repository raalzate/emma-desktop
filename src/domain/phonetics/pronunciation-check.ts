/**
 * Verificación de pronunciación por dictado (§0.5 y Reto B, Parte 1 del libro):
 * el ASR es "el detector de errores de pronunciación más barato y honesto que
 * existe" — si la máquina no transcribe una palabra, la pronunciación falló
 * ahí. Compara el texto objetivo contra lo que Whisper transcribió realmente.
 * Dominio puro: sin IO, solo comparación de strings.
 */

export interface WordVerdict {
  expected: string;
  heard: string | null;
  ok: boolean;
}

export interface PronunciationCheckResult {
  verdicts: WordVerdict[];
  score: number;
  missedWords: string[];
}

/** Minúsculas, sin puntuación, espacios colapsados — para comparar transcripciones. */
export function normalizeSpoken(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:¿¡"'()]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function words(text: string): string[] {
  const normalized = normalizeSpoken(text);
  return normalized.length > 0 ? normalized.split(" ") : [];
}

/**
 * Alinea las palabras objetivo contra las oídas con dos punteros y un
 * lookahead de 1 palabra: tolera que el ASR omita o añada UNA palabra suelta
 * sin descuadrar el resto de la alineación (no es un LCS/edit-distance
 * completo — errores de más de una palabra consecutiva pueden desalinear el
 * resto de la ronda; suficiente para dictado de frases cortas del libro).
 */
function alignWords(expectedWords: string[], heardWords: string[]): WordVerdict[] {
  const verdicts: WordVerdict[] = [];
  let i = 0;
  let j = 0;

  while (i < expectedWords.length) {
    const expected = expectedWords[i];
    const heard = heardWords[j];

    if (heard === undefined) {
      verdicts.push({ expected, heard: null, ok: false });
      i += 1;
      continue;
    }
    if (expected === heard) {
      verdicts.push({ expected, heard, ok: true });
      i += 1;
      j += 1;
      continue;
    }
    // El ASR omitió "expected": la siguiente palabra objetivo ya calza con lo oído actual.
    if (expectedWords[i + 1] === heard) {
      verdicts.push({ expected, heard: null, ok: false });
      i += 1;
      continue;
    }
    // El ASR añadió una palabra extra: la siguiente palabra oída calza con la objetivo actual.
    if (heardWords[j + 1] === expected) {
      j += 1;
      continue;
    }
    // Sustitución: la palabra objetivo se transcribió como otra distinta.
    verdicts.push({ expected, heard, ok: false });
    i += 1;
    j += 1;
  }

  return verdicts;
}

/**
 * Compara el texto objetivo (lo que EMMA pidió pronunciar) contra la
 * transcripción real del ASR. `score` = proporción de palabras objetivo
 * correctamente reconocidas (0–1).
 */
export function checkPronunciation(target: string, transcript: string): PronunciationCheckResult {
  const expectedWords = words(target);
  if (expectedWords.length === 0) {
    throw new Error("target must not be empty");
  }
  const heardWords = words(transcript);

  const verdicts = alignWords(expectedWords, heardWords);
  const correct = verdicts.filter((v) => v.ok).length;
  const score = correct / verdicts.length;
  const missedWords = verdicts.filter((v) => !v.ok).map((v) => v.expected);

  return { verdicts, score, missedWords };
}

/**
 * Umbral de inteligibilidad: el libro persigue que un humano (o una máquina)
 * pueda ENTENDERTE, no que suenes nativo. 0.8 (4 de 5 palabras reconocidas)
 * se toma como el punto en que un dictado deja de "adivinar" y realmente
 * comprende la frase.
 */
export function isIntelligible(score: number): boolean {
  return score >= 0.8;
}

/** Abreviaturas y decimales que llevan punto sin cerrar oración. */
const NOT_A_BOUNDARY = /(?:\b(?:e\.g|i\.e|etc|vs|dr|mr|mrs|ms)\.|\d\.\d)$/i;

/**
 * Parte un texto en oraciones para grabarlas de a una: un párrafo entero de un
 * tirón no se puede dictar. Conserva el signo de cierre de cada oración.
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let current = "";
  for (const piece of text.split(/(?<=[.!?])\s+/)) {
    current = current ? `${current} ${piece}` : piece;
    if (NOT_A_BOUNDARY.test(current)) continue;
    out.push(current.trim());
    current = "";
  }
  if (current.trim()) out.push(current.trim());
  return out.filter(Boolean);
}

/** El dictado no devolvió ninguna palabra: micrófono, silencio o ASR caído. */
export function heardNothing(result: PronunciationCheckResult): boolean {
  return result.verdicts.every((v) => v.heard === null);
}

/**
 * Veredicto de "Say it" por oración (H8): se pide leer una frase completa,
 * pero lo que importa es si la máquina reconoció la PALABRA OBJETIVO dentro
 * de esa frase, más el porcentaje general de inteligibilidad de la oración.
 */
export interface TargetWordVerdict {
  targetWord: string;
  targetHeard: string | null;
  targetOk: boolean;
  overall: PronunciationCheckResult;
}

/**
 * Compara `transcript` contra `sentence` con `checkPronunciation` y extrae el
 * veredicto de la palabra objetivo dentro de esa alineación.
 */
export function checkTargetWordInSentence(
  sentence: string,
  targetWord: string,
  transcript: string,
): TargetWordVerdict {
  const overall = checkPronunciation(sentence, transcript);
  const normalizedTarget = normalizeSpoken(targetWord);
  const verdict = overall.verdicts.find((v) => v.expected === normalizedTarget);
  if (!verdict) {
    throw new Error(`targetWord "${targetWord}" no aparece en sentence "${sentence}"`);
  }
  return {
    targetWord: normalizedTarget,
    targetHeard: verdict.heard,
    targetOk: verdict.ok,
    overall,
  };
}
