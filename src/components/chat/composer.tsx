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
  /** Última línea de la persona: es lo que el aprendiz tiene que responder. */
  context: string;
  /**
   * Contexto de escena para las sugerencias (persona, situación, tema pendiente
   * y lo ya dicho). Sin él las 3 sugerencias salían genéricas.
   */
  sceneContext: string;
  level: CefrLevel;
  /** Escenario de la escena activa: ancla las sugerencias a su unidad del libro. */
  scenarioType: string;
}

export function Composer({ onSend, busy, context, sceneContext, level, scenarioType }: Props) {
  const { runtime } = useEmma();
  const [text, setText] = useState("");
  const suggestions = useSuggestions({
    runtime: runtime!,
    context: sceneContext,
    agentLine: context,
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
    <div className="bg-background px-4 py-3">
      <div className="mx-auto max-w-2xl">
        <SuggestionChips suggestions={suggestions} />
        <div className="flex items-end gap-2">
          {/* Superficie blanca con borde y radio 14px (FR-022). */}
          <div className="relative flex-1 rounded-[14px] border border-border bg-card">
            {/*
              El overlay debe calcar la caja del textarea (mismo padding y el
              mismo salto tipográfico `text-base md:text-sm`): con un tamaño
              fijo, el fantasma se desalineaba del texto bajo el breakpoint md.
              El borde vive en el contenedor; textarea y overlay van sin borde.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words px-3 py-2 text-base text-muted md:text-sm"
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
              className="relative resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            size="icon"
            variant={voice.recording ? "destructive" : "outline"}
            className="h-9 w-9 rounded-full border-border"
            onClick={voice.toggle}
            disabled={busy || voice.busy}
            aria-label={voice.recording ? "Enviar nota de voz" : "Grabar nota de voz"}
          >
            {voice.busy ? <Loader2 className="animate-spin" /> : voice.recording ? <Square /> : <Mic />}
          </Button>
          <Button
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => submit(text)}
            disabled={busy || !text.trim()}
            aria-label="Enviar"
          >
            <Send />
          </Button>
        </div>
        {/* Línea persistente (FR-021): atajos + recordatorio de inmersión, en mono. */}
        <p className="mt-2 font-code text-[11px] tracking-wide text-muted-foreground">
          TAB acepta la sugerencia · ENTER envía · La conversación es solo en inglés
        </p>
      </div>
    </div>
  );
}
