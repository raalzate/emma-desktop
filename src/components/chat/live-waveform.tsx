"use client";

/**
 * Onda en vivo reutilizable: barras que siguen la voz mientras se graba
 * (composer del chat, "Say it" del laboratorio de pronunciación). Sin stream
 * cae a barras planas en reposo — el mismo estilo visual que las burbujas
 * estáticas de audio, pero data-driven vía `useAudioLevels`.
 */

import { useAudioLevels } from "./use-audio-levels";

interface Props {
  stream: MediaStream | null;
  bars?: number;
  className?: string;
  barClassName?: string;
}

const DEFAULT_BARS = 18;

export function LiveWaveform({ stream, bars = DEFAULT_BARS, className, barClassName }: Props) {
  const levels = useAudioLevels(stream, bars);
  return (
    <div className={className ?? "flex h-6 items-center gap-0.5"} aria-hidden>
      {levels.map((level, i) => (
        <span
          key={i}
          className={barClassName ?? "w-0.5 rounded bg-foreground/40"}
          style={{ height: `${Math.round(10 + level * 90)}%` }}
        />
      ))}
    </div>
  );
}
