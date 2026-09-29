"use client";

/**
 * Onda en vivo mientras se graba: lee el nivel del stream con un AnalyserNode
 * (Web Audio) cuadro a cuadro (`requestAnimationFrame`) y lo reduce a N
 * barras normalizadas con el mapeo puro de `@/domain/audio/audio-levels`.
 * Degrada con gracia si no hay stream o el entorno no tiene AudioContext
 * (SSR/tests): devuelve barras planas en reposo, sin lanzar.
 */

import { useEffect, useState } from "react";
import { idleBars, levelsToBars } from "@/domain/audio/audio-levels";

type AudioContextCtor = typeof AudioContext;

/** El prefijo `webkit` sigue haciendo falta en algún WebKit embebido. */
function resolveAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as typeof window & { webkitAudioContext?: AudioContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Barras normalizadas (0..1) que siguen el nivel de voz de `stream`, o planas si no hay stream. */
export function useAudioLevels(stream: MediaStream | null, bars: number): number[] {
  const [levels, setLevels] = useState<number[]>(() => idleBars(bars));

  useEffect(() => {
    if (!stream) {
      setLevels(idleBars(bars));
      return;
    }
    const AudioContextCtor = resolveAudioContextCtor();
    if (!AudioContextCtor) {
      setLevels(idleBars(bars));
      return;
    }

    const ctx = new AudioContextCtor();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      setLevels(levelsToBars(data, bars));
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      analyser.disconnect();
      void ctx.close().catch(() => {});
    };
  }, [stream, bars]);

  return levels;
}
