/**
 * Value objects de captura de audio: detección de silencio por energía RMS y
 * acumulación de chunks. Dominio puro — opera sobre muestras PCM (int16 en
 * number[]) y dBFS, sin Web APIs (getUserMedia/AudioContext viven en el
 * renderer). Port de audio_session.py + audio_signal.py + la lógica de silencio
 * de interface/audio_handler.py.
 */

import {
  MAX_DURATION_MS,
  SILENCE_THRESHOLD_DBFS,
  SILENCE_TIMEOUT_MS,
} from "@/domain/audio/audio-config";

const SILENT_FLOOR_DBFS = -100.0;
const INT16_FULL_SCALE = 32768.0;

/** Energía RMS en dBFS de un chunk PCM de 16 bits (muestras int16). */
export function rmsDbfs(samples: number[]): number {
  if (samples.length === 0) return SILENT_FLOOR_DBFS;
  const meanSquare = samples.reduce((acc, s) => acc + s * s, 0) / samples.length;
  const rms = Math.sqrt(meanSquare);
  if (rms < 1.0) return SILENT_FLOOR_DBFS;
  return 20.0 * Math.log10(rms / INT16_FULL_SCALE);
}

/** Un único evento de grabación dentro de una sesión de simulación. */
export class AudioSession {
  chunks: number[][] = [];
  isSpeaking = false;
  silentDurationMs = 0.0;
  startTimeMs = 0.0;
  lastChunkTimeMs = 0.0;

  /** Añade un chunk y actualiza el timing. */
  appendChunk(data: number[], elapsedTimeMs: number): void {
    if (this.chunks.length === 0) this.startTimeMs = elapsedTimeMs;
    this.chunks.push(data);
    this.lastChunkTimeMs = elapsedTimeMs;
  }

  /** Duración total desde el primer al último chunk. */
  get totalDurationMs(): number {
    if (this.chunks.length === 0) return 0.0;
    return this.lastChunkTimeMs - this.startTimeMs;
  }

  /** Muestras PCM concatenadas de todos los chunks. */
  getSamples(): number[] {
    return this.chunks.flat();
  }

  /** Limpia los chunks y resetea el estado. */
  reset(): void {
    this.chunks = [];
    this.isSpeaking = false;
    this.silentDurationMs = 0.0;
    this.startTimeMs = 0.0;
    this.lastChunkTimeMs = 0.0;
  }

  /** True si la duración total está por debajo del mínimo. */
  isTooShort(minDurationMs: number): boolean {
    return this.totalDurationMs < minDurationMs;
  }

  /** Actualiza estado hablando/silencio según el nivel de energía. */
  updateSilence(dbfs: number, deltaMs: number): void {
    if (dbfs >= SILENCE_THRESHOLD_DBFS) {
      this.isSpeaking = true;
      this.silentDurationMs = 0.0;
    } else if (this.isSpeaking) {
      this.silentDurationMs += deltaMs;
    }
  }

  /** True si el audio debe auto-enviarse (silencio tras voz, o corte a 60 s). */
  shouldAutoSubmit(elapsedMs: number): boolean {
    const silenceTriggered =
      this.isSpeaking && this.silentDurationMs >= SILENCE_TIMEOUT_MS;
    return silenceTriggered || elapsedMs >= MAX_DURATION_MS;
  }
}

/** Resultado de un intento de transcripción de audio. */
export class TranscriptionResult {
  readonly text: string;
  readonly success: boolean;

  constructor(text: string, success: boolean) {
    this.text = text;
    this.success = success;
  }

  /** Resultado vacío y sin éxito. */
  static empty(): TranscriptionResult {
    return new TranscriptionResult("", false);
  }

  /** Con éxito solo si el texto tiene contenido no vacío. */
  static fromText(text: string): TranscriptionResult {
    return new TranscriptionResult(text, text.trim().length > 0);
  }
}
