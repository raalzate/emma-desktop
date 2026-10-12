/**
 * Estimación de timings por palabra para motores TTS que solo devuelven el
 * audio (Kokoro). Reparte la duración en proporción al largo de cada palabra,
 * con una pausa extra tras la puntuación. Los intervalos son contiguos
 * [start,end) y las palabras se parten por espacios, igual que `speakText` en
 * `buildKaraokeScript`, así el índice de palabra coincide con el karaoke.
 */

import type { WordTiming } from "@/domain/ai/llm-port";

/** Peso de la pausa, en "letras equivalentes", según la puntuación final. */
const PAUSE_AFTER_STOP = 4; // . ! ? …
const PAUSE_AFTER_COMMA = 2; // , ; : —

function weightOf(word: string): number {
  const letters = Math.max(word.replace(/[^\p{L}\p{N}]/gu, "").length, 1);
  return letters + pauseWeight(word);
}

function pauseWeight(word: string): number {
  const ending = word.replace(/["'”’)\]]+$/, "").slice(-1);
  if (/[.!?…]/.test(ending)) return PAUSE_AFTER_STOP;
  if (/[,;:—–]/.test(ending)) return PAUSE_AFTER_COMMA;
  return 0;
}

export function estimateWordTimings(text: string, durationSec: number): WordTiming[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0 || !(durationSec > 0)) return [];

  const weights = words.map(weightOf);
  const total = weights.reduce((a, b) => a + b, 0);
  let acumulado = 0;
  return words.map((word, i) => {
    const start = (acumulado / total) * durationSec;
    acumulado += weights[i];
    const end = i === words.length - 1 ? durationSec : (acumulado / total) * durationSec;
    return { word, start, end };
  });
}
