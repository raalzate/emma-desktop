"use client";

/**
 * Burbuja "nota de voz" de Emma estilo WhatsApp: un botón de play que locuta el
 * texto y resalta la palabra actual (karaoke), transcripción y las acciones
 * 📚 Teach me / 🌐 Translate. Sin autoplay: la voz sólo suena al pulsar.
 *
 * La transcripción arranca ABIERTA: el aprendiz necesita leer mientras escucha
 * (input comprensible); esconderla obligaba a un clic extra en cada turno.
 */

import { useState } from "react";
import { BookOpen, ChevronDown, Languages, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useKaraoke } from "./use-karaoke";
import { KaraokeTranscript } from "./karaoke-transcript";
import { formatTime } from "./chat-time";
import type { VoiceGender } from "@/domain/chat-settings/chat-settings";
import type { Protopersona } from "@/domain/personas/protopersona";

interface Props {
  text: string;
  at?: number;
  gender?: VoiceGender;
  /** Protopersona que habla en la escena; sin ella, la burbuja es de Emma. */
  persona?: Protopersona;
  onTeach?: () => void;
  onTranslate?: () => void;
}

export function EmmaBubble({ text, at, gender, persona, onTeach, onTranslate }: Props) {
  const [open, setOpen] = useState(true);
  const k = useKaraoke(text, persona?.voice ?? gender, persona?.ttsVoice);

  const toggle = () => {
    if (k.playing) return k.stop();
    setOpen(true);
    k.play();
  };
  return (
    <div className="flex justify-start duration-300 animate-in fade-in slide-in-from-bottom-1">
      {/* Tarjeta con borde y esquina superior izquierda 4px; sombra mínima (FR-015).
          Sin avatar por turno: quién habla ya vive en la cabecera, como en un 1:1. */}
      <div className="w-fit min-w-[260px] max-w-[75%] rounded-bubble rounded-tl-[4px] border border-border bg-card px-3 py-2 shadow-[0_1px_2px_rgba(31,41,51,0.06)]">
        {persona && (
          <p className="mb-0.5 text-xs font-semibold text-primary">{persona.name}</p>
        )}
        <div className="flex items-center gap-2">
          <Button size="icon" className="h-8 w-8 rounded-full" title={k.playing ? "Detén la lectura en voz alta" : "Escucha el mensaje con la voz de Emma; sigue las palabras resaltadas"} onClick={toggle} disabled={!k.available || k.loading} aria-label={k.playing ? "Stop" : "Play"}>
            {k.loading ? <Loader2 className="animate-spin" /> : k.playing ? <Pause /> : <Play />}
          </Button>
          <div className="flex h-6 flex-1 items-center gap-0.5" aria-hidden>
            {Array.from({ length: 22 }).map((_, i) => (
              <span key={i} className="w-0.5 rounded bg-foreground/25" style={{ height: `${20 + ((i * 37) % 60)}%` }} />
            ))}
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7" title={open ? "Oculta el texto del mensaje" : "Muestra el texto del mensaje para leerlo mientras escuchas"} onClick={() => setOpen((o) => !o)} aria-label="Show transcript">
            <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          </Button>
        </div>
        {open && (
          <KaraokeTranscript
            sentences={k.sentences}
            active={k.activeSentence}
            activeWord={k.activeWord}
            onPick={(i) => {
              setOpen(true);
              k.playSentence(i);
            }}
          />
        )}
        {/* Acciones ghost azules con Tooltip Radix en español (FR-017): el globo
            es el único andamiaje en español; el label va en inglés (Art. 9). */}
        <TooltipProvider delayDuration={300}>
          <div className="mt-2 flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary-deep"
                  onClick={onTeach}
                >
                  <BookOpen className="h-3.5 w-3.5" /> Teach me
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Explicación en español: vocabulario y gramática de este mensaje
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary-deep"
                  onClick={onTranslate}
                >
                  <Languages className="h-3.5 w-3.5" /> Translate
                </Button>
              </TooltipTrigger>
              <TooltipContent>Traducir este mensaje al español</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        {at && (
          <span className="mt-1 block text-right font-code text-[10px] text-muted-foreground">
            {formatTime(at)}
          </span>
        )}
      </div>
    </div>
  );
}
