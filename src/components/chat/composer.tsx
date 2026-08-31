"use client";

/**
 * Composer del turno del aprendiz: textarea con typeahead fantasma (Tab acepta,
 * Esc descarta, Enter envía), chips de sugerencia arriba y botón enviar. Flujo
 * por turnos estricto: deshabilitado mientras Emma tiene el turno (`busy`).
 */

import { useState } from "react";
import { Send, Mic, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEmma } from "@/interface/emma-context";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { useTypeahead } from "./use-typeahead";
import { useSuggestions } from "./use-suggestions";
import { SuggestionChips } from "./suggestion-chips";
import { useVoiceInput } from "./use-voice-input";

interface Props {
  onSend: (text: string, audioUrl?: string) => void;
  busy: boolean;
  context: string;
  level: CefrLevel;
  /** Escenario de la escena activa: ancla las sugerencias a su unidad del libro. */
  scenarioType: string;
}

export function Composer({ onSend, busy, context, level, scenarioType }: Props) {
  const { runtime } = useEmma();
  const [text, setText] = useState("");
  const suggestions = useSuggestions({
    runtime: runtime!,
    context,
    level,
    busy,
    draft: text,
    scenarioType,
  });
  const { ghost, clearGhost } = useTypeahead(runtime!, context, text, busy, level);
  // Nota de voz (WhatsApp): al terminar de grabar, envía audio + transcripción a la IA.
  const voice = useVoiceInput((t, audioUrl) => onSend(t, audioUrl));

  const submit = (value: string) => {
    const clean = value.trim();
    if (!clean || busy) return;
    onSend(clean);
    setText("");
    clearGhost();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && ghost) {
      e.preventDefault();
      setText(text + ghost);
      clearGhost();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(text);
    } else if (e.key === "Escape") {
      clearGhost();
    }
  };

  return (
    <div className="border-t bg-background px-4 py-3">
      <div className="mx-auto max-w-2xl">
        <SuggestionChips suggestions={suggestions} />
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            {/*
              El overlay debe calcar la caja del textarea (padding, borde y el
              mismo salto tipográfico `text-base md:text-sm`): con un tamaño
              fijo, el fantasma se desalineaba del texto bajo el breakpoint md.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words border border-transparent px-3 py-2 text-base text-muted-foreground md:text-sm"
            >
              <span className="invisible">{text}</span>
              {ghost}
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={busy ? "Emma está escribiendo…" : "Escribe tu respuesta en inglés…"}
              disabled={busy}
              rows={2}
              className="relative resize-none bg-transparent"
            />
          </div>
          <Button
            size="icon"
            variant={voice.recording ? "destructive" : "secondary"}
            onClick={voice.toggle}
            disabled={busy || voice.busy}
            aria-label={voice.recording ? "Enviar nota de voz" : "Grabar nota de voz"}
          >
            {voice.busy ? <Loader2 className="animate-spin" /> : voice.recording ? <Square /> : <Mic />}
          </Button>
          <Button size="icon" onClick={() => submit(text)} disabled={busy || !text.trim()} aria-label="Enviar">
            <Send />
          </Button>
        </div>
        {ghost && <p className="mt-1 text-xs text-muted-foreground">Pulsa Tab para aceptar la sugerencia</p>}
      </div>
    </div>
  );
}
