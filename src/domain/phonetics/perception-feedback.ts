/**
 * Retroalimentación del laboratorio de pares mínimos (#357).
 *
 * El "why": en producción la palabra objetivo se veía resaltada ANTES de
 * responder, así que el ejercicio de escucha se resolvía leyendo; y el resumen
 * «Correct: 10 of 10» no decía qué significaba ni qué hacer después. Dominio
 * puro: sólo texto y números.
 */

export interface MaskedParts {
  before: string;
  after: string;
}

/** Parte la oración alrededor de la primera aparición de `word` (palabra completa). */
export function maskWord(sentence: string, word: string): MaskedParts | null {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`\\b${escaped}\\b`, "i").exec(sentence);
  if (!match) return null;
  return { before: sentence.slice(0, match.index), after: sentence.slice(match.index + match[0].length) };
}

export type RoundTone = "great" | "good" | "keep";

export interface RoundVerdict {
  percent: number;
  tone: RoundTone;
  headline: string;
}

const HEADLINES: Record<RoundTone, string> = {
  great: "Excellent ear!",
  good: "Good — a few sounds to reinforce",
  keep: "Keep training this sound",
};

/** Lectura del resultado de la ronda: ≥ 90 % excelente, ≥ 70 % bien, si no, a entrenar. */
export function roundVerdict(score: { correct: number; total: number }): RoundVerdict {
  const percent = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const tone: RoundTone = percent >= 90 ? "great" : percent >= 70 ? "good" : "keep";
  return { percent, tone, headline: HEADLINES[tone] };
}
