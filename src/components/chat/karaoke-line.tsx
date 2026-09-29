"use client";

/**
 * Bloque reusable «karaoke de una línea»: botón de play + el texto en inglés
 * resaltado (oración/palabra) mientras suena, con clic-para-repetir por
 * oración cuando el motor lo permite. Nace de #196 para no repetir
 * `SpeakButton` + un `<span>` plano en cada fila de Teach me/Translate.
 */

import { Loader2, Pause, Volume2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useKaraoke } from "./use-karaoke";
import { KaraokeTranscript } from "./karaoke-transcript";
import type { VoiceGender } from "@/domain/chat-settings/chat-settings";

interface Props {
  text: string;
  gender?: VoiceGender;
  voiceId?: string;
  className?: string;
  /** Clases del texto (tamaño/color); por defecto coincide con una fila de sugerencia. */
  textClassName?: string;
  /** Contenido opcional al final de la fila (p.ej. una badge). */
  trailing?: ReactNode;
}

export function KaraokeLine({ text, gender, voiceId, className, textClassName, trailing }: Props) {
  const k = useKaraoke(text, gender, voiceId);
  const toggle = () => (k.playing ? k.stop() : k.play());
  const icon = k.loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : k.playing ? (
    <Pause className="h-4 w-4" />
  ) : (
    <Volume2 className="h-4 w-4" />
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 rounded-full text-primary"
        title={k.playing ? "Detén la reproducción" : "Escucha cómo se pronuncia antes de decirlo tú"}
        onClick={toggle}
        disabled={!k.available || k.loading}
        aria-label={k.playing ? "Stop" : "Listen to pronunciation"}
      >
        {icon}
      </Button>
      <KaraokeTranscript
        sentences={k.sentences}
        active={k.activeSentence}
        activeWord={k.activeWord}
        onPick={(i) => k.playSentence(i)}
        seekable={k.canSeek}
        className={cn("mt-0 flex-1 text-sm font-medium", textClassName)}
      />
      {trailing}
    </div>
  );
}
