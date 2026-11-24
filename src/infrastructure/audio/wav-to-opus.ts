/**
 * Transcodificador WAV → Opus/WebM en el renderer. Sin dependencias nuevas:
 * decodifica el WAV con Web Audio, lo reproduce hacia un
 * `MediaStreamAudioDestinationNode` (no sale por los parlantes) y lo graba con
 * el MISMO `MediaRecorder` (Opus, 32 kbps) que las notas de voz. Corre en tiempo
 * real, en segundo plano y con tope de 60 s. Adaptador fino detrás de
 * `Transcoder`: MediaRecorder no existe en Vitest, se verifica por CDP.
 */

import { MAX_DURATION_MS } from "@/domain/audio/audio-config";
import { recorderOptionsFor } from "./clip-recorder-options";

export interface TranscodedClip {
  data: Uint8Array;
  durationMs: number;
}

export type Transcoder = (wav: Blob, signal?: AbortSignal) => Promise<TranscodedClip>;

/** Kokoro sintetiza a 24 kHz: grabar a esa tasa evita remuestrear. */
export const KOKORO_SAMPLE_RATE = 24_000;
/** Holgura sobre la duración del audio antes de dar la grabación por colgada. */
const HANG_MARGIN_MS = 5_000;

/** Duración a grabar: la del audio, con el tope duro de 60 s. */
export function cappedDurationMs(audioSeconds: number): number {
  return Math.min(Math.round(audioSeconds * 1000), MAX_DURATION_MS);
}

/** Cuándo cortar la grabación: al tope si el audio lo excede; si no, con holgura. */
export function stopAfterMs(audioSeconds: number): number {
  const duration = cappedDurationMs(audioSeconds);
  return duration >= MAX_DURATION_MS ? MAX_DURATION_MS : duration + HANG_MARGIN_MS;
}

export const wavToOpus: Transcoder = async (wav, signal) => {
  const ctx = new AudioContext({ sampleRate: KOKORO_SAMPLE_RATE });
  try {
    const decoded = await ctx.decodeAudioData(await wav.arrayBuffer());
    await ctx.resume();
    const durationMs = cappedDurationMs(decoded.duration);
    const destination = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = decoded;
    source.connect(destination);

    const recorder = new MediaRecorder(destination.stream, recorderOptionsFor((m) => MediaRecorder.isTypeSupported(m)));
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    const finished = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("MediaRecorder falló al grabar la frase"));
      signal?.addEventListener("abort", () => reject(new Error("Transcodificación cancelada")), { once: true });
    });
    const stop = () => recorder.state === "recording" && recorder.stop();
    // Termina cuando acaba el audio; el tope y el margen cubren un audio colgado.
    source.onended = stop;
    const cap = setTimeout(stop, stopAfterMs(decoded.duration));

    recorder.start();
    source.start();
    try {
      await finished;
    } finally {
      clearTimeout(cap);
      stop();
    }
    const blob = new Blob(chunks, { type: recorder.mimeType });
    return { data: new Uint8Array(await blob.arrayBuffer()), durationMs };
  } finally {
    void ctx.close().catch(() => undefined);
  }
};
