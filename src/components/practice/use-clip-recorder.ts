"use client";

/**
 * Grabador del intento de lectura (FR-014): `MediaRecorder` en Opus a 32 kbps,
 * con corte automático a MAX_CLIP_SECONDS. Implementa `ClipRecorder` y además
 * devuelve los bytes y la duración para guardarlos con `recordAttempt`.
 * Fino a propósito (API del navegador): se verifica por CDP en la app real.
 */

import { useEffect, useMemo } from "react";
import { CLIP_MIME, MAX_CLIP_SECONDS } from "@/domain/audio/audio-clip";
import type { ClipRecorder } from "@/components/practice/audio-recall-card";

const AUDIO_BITS_PER_SECOND = 32_000;

export interface RecordedAttempt {
  /** URL de objeto para reproducir el intento; la libera `dispose`. */
  url: string;
  data: Uint8Array;
  durationMs: number;
}

export interface AttemptRecorder extends ClipRecorder {
  stop(): Promise<RecordedAttempt>;
  /** Cancela la grabación en curso y libera el micrófono y la URL. */
  dispose(): void;
}

export function createAttemptRecorder(): AttemptRecorder {
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let url: string | null = null;
  let finished: Promise<RecordedAttempt> | null = null;

  function release() {
    if (timer) clearTimeout(timer);
    timer = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  function revokeUrl() {
    if (url) URL.revokeObjectURL(url);
    url = null;
  }

  return {
    async start() {
      revokeUrl();
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const startedAt = Date.now();
      const rec = new MediaRecorder(media, { mimeType: CLIP_MIME, audioBitsPerSecond: AUDIO_BITS_PER_SECOND });
      finished = new Promise<RecordedAttempt>((resolve, reject) => {
        rec.ondataavailable = (e) => chunks.push(e.data);
        rec.onerror = () => reject(new Error("recording failed"));
        rec.onstop = () => {
          const blob = new Blob(chunks, { type: CLIP_MIME });
          void blob.arrayBuffer().then((buffer) => {
            url = URL.createObjectURL(blob);
            resolve({ url, data: new Uint8Array(buffer), durationMs: Date.now() - startedAt });
          }, reject);
        };
      });
      recorder = rec;
      stream = media;
      rec.start();
      timer = setTimeout(() => rec.state === "recording" && rec.stop(), MAX_CLIP_SECONDS * 1000);
    },
    async stop() {
      const rec = recorder;
      const done = finished;
      if (!rec || !done) throw new Error("no recording in progress");
      if (rec.state === "recording") rec.stop();
      recorder = null;
      finished = null;
      release();
      return done;
    },
    dispose() {
      if (recorder?.state === "recording") recorder.stop();
      recorder = null;
      release();
      revokeUrl();
    },
  };
}

/** Un grabador por montaje; al desmontar suelta el micrófono y la URL. */
export function useClipRecorder(): AttemptRecorder {
  const recorder = useMemo(createAttemptRecorder, []);
  useEffect(() => () => recorder.dispose(), [recorder]);
  return recorder;
}
