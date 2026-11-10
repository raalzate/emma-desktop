/**
 * Formato único de los clips grabados: Opus en WebM a 32 kbps (~240 KB por
 * 60 s). Lo comparten la nota de voz del aprendiz y el transcodificador de las
 * frases de EMMA para que haya un solo formato que reproducir y validar.
 */

import { CLIP_MIME } from "@/domain/audio/audio-clip";

export const VOICE_MIME = CLIP_MIME;
export const VOICE_BITRATE = 32_000;

export function recorderOptionsFor(isTypeSupported: (mime: string) => boolean): MediaRecorderOptions {
  return isTypeSupported(VOICE_MIME)
    ? { mimeType: VOICE_MIME, audioBitsPerSecond: VOICE_BITRATE }
    : { audioBitsPerSecond: VOICE_BITRATE };
}
