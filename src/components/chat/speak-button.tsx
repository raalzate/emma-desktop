"use client";

/**
 * Botón para escuchar la pronunciación de un texto en inglés. Reutiliza el
 * motor TTS (Edge-TTS con caída a Web Speech) vía useKaraoke. Sin karaoke:
 * sólo reproduce/detiene. Sin `label` es el icono compacto de las filas de
 * Teach me y Translate; con `label` es un botón visible con texto, para los
 * ejercicios de sonido donde escuchar ES la tarea.
 */

import { Loader2, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKaraoke } from "./use-karaoke";
import type { VoiceGender } from "@/domain/chat-settings/chat-settings";

interface Props {
  text: string;
  gender?: VoiceGender;
  /** Texto visible del botón; si falta, el botón es sólo el icono. */
  label?: string;
}

export function SpeakButton({ text, gender, label }: Props) {
  const k = useKaraoke(text, gender);
  const icon = k.loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : k.playing ? (
    <Pause className="h-4 w-4" />
  ) : (
    <Volume2 className="h-4 w-4" />
  );
  const toggle = () => (k.playing ? k.stop() : k.play());
  const ariaLabel = k.playing ? "Stop" : "Listen to pronunciation";

  if (label) {
    return (
      <Button
        type="button"
        variant="secondary"
        title={k.playing ? "Detén la reproducción" : "Escucha cómo se pronuncia antes de decirlo tú"}
        onClick={toggle}
        disabled={!k.available || k.loading}
        aria-label={ariaLabel}
        className="gap-2 text-primary"
      >
        {icon}
        {k.playing ? "Stop" : label}
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7 shrink-0 rounded-full text-primary"
      title={k.playing ? "Detén la reproducción" : "Escucha cómo se pronuncia antes de decirlo tú"}
      onClick={toggle}
      disabled={!k.available || k.loading}
      aria-label={ariaLabel}
    >
      {icon}
    </Button>
  );
}
