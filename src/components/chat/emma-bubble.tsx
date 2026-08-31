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
import { cn } from "@/lib/utils";
import { useKaraoke } from "./use-karaoke";
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

/** Avatar con la inicial de quien habla (Sofía → "S"; Emma → "E"). */
function Avatar({ name }: { name?: string }) {
  const initial = (name ?? "Emma").trim().charAt(0).toUpperCase();
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
      title={name ?? "Emma"}
    >
      {initial}
    </div>
  );
}

// Transcripción por ORACIONES: la activa se resalta como bloque y cada oración
// con audio es clicable para repetirla (FR-010/011). Las sin audio (solo
// símbolos) se muestran pero no reaccionan al clic.
function Transcript({
  sentences,
  active,
  onPick,
}: {
  sentences: { text: string; wordCount: number }[];
  active: number;
  onPick: (i: number) => void;
}) {
  return (
    <p className="mt-2 text-sm leading-relaxed">
      {sentences.map((s, i) => {
        const clickable = s.wordCount > 0;
        return (
          <span
            key={i}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            title={clickable ? "Clic para escuchar esta oración" : undefined}
            onClick={clickable ? () => onPick(i) : undefined}
            onKeyDown={clickable ? (e) => e.key === "Enter" && onPick(i) : undefined}
            className={cn(
              "rounded px-0.5 transition-colors",
              clickable && "cursor-pointer hover:bg-primary/10",
              i === active && "bg-primary/20 text-primary",
            )}
          >
            {s.text}{" "}
          </span>
        );
      })}
    </p>
  );
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
    <div className="flex gap-2 duration-300 animate-in fade-in slide-in-from-bottom-1">
      <Avatar name={persona?.name} />
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 shadow-sm">
        {persona && (
          <p className="mb-0.5 text-xs font-semibold text-primary">{persona.name}</p>
        )}
        <div className="flex items-center gap-2">
          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={toggle} disabled={!k.available || k.loading} aria-label={k.playing ? "Detener" : "Reproducir"}>
            {k.loading ? <Loader2 className="animate-spin" /> : k.playing ? <Pause /> : <Play />}
          </Button>
          <div className="flex h-6 flex-1 items-center gap-0.5" aria-hidden>
            {Array.from({ length: 22 }).map((_, i) => (
              <span key={i} className="w-0.5 rounded bg-foreground/25" style={{ height: `${20 + ((i * 37) % 60)}%` }} />
            ))}
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen((o) => !o)} aria-label="Ver transcripción">
            <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          </Button>
        </div>
        {open && (
          <Transcript
            sentences={k.sentences}
            active={k.activeSentence}
            onPick={(i) => {
              setOpen(true);
              k.playSentence(i);
            }}
          />
        )}
        <div className="mt-2 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs"
            onClick={onTeach}
            title="Explicación en español: vocabulario y gramática de este mensaje"
          >
            <BookOpen className="h-3.5 w-3.5" /> Teach me
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs"
            onClick={onTranslate}
            title="Traducir este mensaje al español"
          >
            <Languages className="h-3.5 w-3.5" /> Translate
          </Button>
        </div>
        {at && <span className="mt-1 block text-[10px] text-muted-foreground">{formatTime(at)}</span>}
      </div>
    </div>
  );
}
