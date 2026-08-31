/**
 * Caso de uso: cierra el bucle de producción del libro (§0.5 y Reto B, Parte
 * 1) — dicta un texto objetivo, transcribe con el puerto ASR ya existente
 * del dominio (`Transcribe` de `@/domain/audio/i-transcribe`, el mismo que
 * usa `use-voice-input.ts`) y compara contra el objetivo con
 * `checkPronunciation`. Si el ASR falla, degrada a transcripción vacía en
 * vez de romper el flujo (igual criterio que `transcribeAudio`).
 */

import type { Transcribe } from "@/domain/audio/i-transcribe";
import {
  checkPronunciation,
  type PronunciationCheckResult,
} from "@/domain/phonetics/pronunciation-check";

export interface CheckSpokenAttemptResult extends PronunciationCheckResult {
  transcript: string;
}

export async function checkSpokenAttempt(args: {
  transcribe: Transcribe;
  audio: Float32Array | number[];
  target: string;
}): Promise<CheckSpokenAttemptResult> {
  if (args.target.trim().length === 0) {
    throw new Error("target must not be empty");
  }

  let transcript = "";
  try {
    transcript = await args.transcribe(args.audio);
  } catch {
    // El ASR puede fallar (modelo no cargado, audio corrupto): degradamos a
    // transcripción vacía para que el aprendiz vea "no te entendí" en vez de
    // que la UI se rompa.
    transcript = "";
  }

  const result = checkPronunciation(args.target, transcript);
  return { ...result, transcript };
}
