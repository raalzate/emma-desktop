/**
 * Caso de uso de transcripción con guarda de duración (port de
 * transcribe_audio_use_case.py). El ASR llega inyectado como el puerto
 * Transcribe; si el audio es demasiado corto o la transcripción falla, se
 * devuelve un resultado vacío (degradación silenciosa).
 */

import { TranscriptionResult } from "@/domain/audio/audio-session";
import type { Transcribe } from "@/domain/audio/i-transcribe";

export async function transcribeAudio(args: {
  transcribe: Transcribe;
  audio: Float32Array | number[];
  minDurationMs: number;
  durationMs: number;
}): Promise<TranscriptionResult> {
  if (args.durationMs < args.minDurationMs) return TranscriptionResult.empty();
  try {
    const text = await args.transcribe(args.audio);
    return TranscriptionResult.fromText(text);
  } catch {
    // El original captura TranscriptionError; aquí cualquier fallo del ASR
    // degrada a resultado vacío sin romper el turno.
    return TranscriptionResult.empty();
  }
}
