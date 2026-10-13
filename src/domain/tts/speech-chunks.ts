/**
 * Troceo del texto hablable para sintetizar por partes: el audio arranca con
 * la primera oración mientras el motor sigue con las demás (Kokoro local corre
 * en CPU y sintetiza más lento que el tiempo real; sin trocear, el primer
 * sonido esperaba a TODO el mensaje). Los trozos salen de `buildKaraokeScript`,
 * así el índice de palabra de cada trozo calza con el karaoke.
 */

import type { WordTiming } from "@/domain/ai/llm-port";
import { buildKaraokeScript } from "@/domain/chat/transcript-sentences";

export interface SpeechChunk {
  /** Texto hablable del trozo (una o más oraciones). */
  text: string;
  /** Índice global de su primera palabra en el speakText completo. */
  wordStart: number;
  wordCount: number;
}

/** Menos palabras que esto suena a golpe suelto: se une a la oración vecina. */
const MIN_CHUNK_WORDS = 3;

function join(a: SpeechChunk, b: SpeechChunk): SpeechChunk {
  return { text: `${a.text} ${b.text}`, wordStart: a.wordStart, wordCount: a.wordCount + b.wordCount };
}

export function planSpeechChunks(text: string): SpeechChunk[] {
  const chunks: SpeechChunk[] = [];
  let pending: SpeechChunk | null = null;

  for (const s of buildKaraokeScript(text).sentences) {
    if (s.wordCount === 0) continue;
    const sentence: SpeechChunk = { text: s.speakText, wordStart: s.wordStart, wordCount: s.wordCount };
    pending = pending ? join(pending, sentence) : sentence;
    if (pending.wordCount >= MIN_CHUNK_WORDS) {
      chunks.push(pending);
      pending = null;
    }
  }

  if (!pending) return chunks;
  const last = chunks.pop();
  chunks.push(last ? join(last, pending) : pending);
  return chunks;
}

/** Copia los timings de un trozo desplazados al tiempo global de la nota. */
export function offsetTimings(timings: ReadonlyArray<WordTiming>, offsetSec: number): WordTiming[] {
  return timings.map((t) => ({ ...t, start: t.start + offsetSec, end: t.end + offsetSec }));
}

/** Trozo (por sus offsets de inicio, ascendentes) que contiene el tiempo global t; -1 si no hay. */
export function chunkIndexAtTime(starts: ReadonlyArray<number>, t: number): number {
  for (let i = starts.length - 1; i >= 0; i--) if (t >= starts[i]) return i;
  return starts.length > 0 ? 0 : -1;
}
