"use client";

/**
 * Ayudas del shadowing (#357, T5): velocidad del audio (el audio a 1× era muy
 * rápido para entender) y la traducción al español de cada frase en tooltip,
 * que se pide al pasar el mouse.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSpanishTranslation } from "./use-spanish-translation";

export const SPEEDS = [1, 0.75, 0.5] as const;
export type Speed = (typeof SPEEDS)[number];


export function SpeedPicker({ value, onChange }: { value: Speed; onChange: (s: Speed) => void }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Audio speed">
      <span className="mr-1 text-xs text-muted-foreground">Speed</span>
      {SPEEDS.map((s) => (
        <Button
          key={s}
          size="sm"
          variant={value === s ? "default" : "outline"}
          className="h-7 px-2 text-xs"
          aria-pressed={value === s}
          title={s === 1 ? "Velocidad normal" : s === 0.75 ? "Un poco más lento, para seguir cada palabra" : "Muy lento, para escuchar cada sonido"}
          onClick={() => onChange(s)}
        >
          {s}×
        </Button>
      ))}
    </div>
  );
}

/** «ES» con la traducción de la frase en el tooltip; se traduce al pasar el mouse. */
export function TranslationHint({ sentence }: { sentence: string }) {
  const [asked, setAsked] = useState(false);
  const es = useSpanishTranslation(sentence, asked);
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2 font-code text-[11px]"
      title={es.text ?? (es.loading ? "Traduciendo al español…" : "Pasa el mouse para ver la traducción al español")}
      onMouseEnter={() => setAsked(true)}
      onFocus={() => setAsked(true)}
      onClick={() => setAsked(true)}
    >
      ES
    </Button>
  );
}
