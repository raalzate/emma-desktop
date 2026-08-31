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
