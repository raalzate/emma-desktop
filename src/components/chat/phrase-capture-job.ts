/**
 * Trabajo en segundo plano que guarda las frases de EMMA como audio (T29).
 * Una sola captura a la vez y cancelable: Kokoro procesa una síntesis por vez y
 * si el aprendiz abre otra lección, esa lección tiene la cola. Vive fuera de
 * React para sobrevivir al remonte del panel al cambiar de escena.
 */

import type { PhraseToKeep } from "@/domain/audio/scene-phrases";

export interface PhraseCaptureJob {
  /** Arranca la captura (cancela la anterior); no rechaza nunca. */
  start(phrases: readonly PhraseToKeep[], run: (signal: AbortSignal) => Promise<unknown>): Promise<void>;
  cancel(): void;
  running(): boolean;
}

export function createPhraseCaptureJob(onError?: (error: unknown) => void): PhraseCaptureJob {
  let current: AbortController | null = null;

  const cancel = () => {
    current?.abort();
    current = null;
  };

  const start: PhraseCaptureJob["start"] = async (phrases, run) => {
    if (phrases.length === 0) return;
    cancel();
    const mine = new AbortController();
    current = mine;
    try {
      await run(mine.signal);
    } catch (error) {
      onError?.(error);
    } finally {
      if (current === mine) current = null;
    }
  };

  return { start, cancel, running: () => current !== null };
}

/** Instancia compartida de la app. */
export const emmaPhraseCapture = createPhraseCaptureJob((error) =>
  console.warn("[audio] captura de frases de EMMA interrumpida", error),
);
