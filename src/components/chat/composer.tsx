"use client";

/**
 * Composer del turno del aprendiz: textarea con typeahead fantasma (Tab acepta,
 * Esc descarta, Enter envía), chips de sugerencia arriba y botón enviar. Flujo
 * por turnos estricto: deshabilitado mientras Emma tiene el turno (`busy`).
 */

import { useState } from "react";
import { Send, Mic, MicOff, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEmma } from "@/interface/emma-context";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { useTypeahead } from "./use-typeahead";
import { useSuggestions } from "./use-suggestions";
import { SuggestionChips } from "./suggestion-chips";
import { useVoiceInput } from "./use-voice-input";
import type { VoiceRequirement } from "@/domain/chat/voice-requirement";

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
  /**
   * Este turno exige voz (regla de `domain/chat/voice-requirement`). El
   * componente no decide: sólo bloquea el texto y explica por qué.
   */
  voiceRequirement?: VoiceRequirement | null;
  /** Salida de emergencia: el aprendiz declara que no puede hablar ahora. */
  onVoiceUnavailable?: () => void;
}

export function Composer({
  onSend, busy, context, sceneContext, level, scenarioType,
  voiceRequirement, onVoiceUnavailable,
}: Props) {
  const { runtime } = useEmma();
  const [text, setText] = useState("");
  // Aviso del turno hablado (transcripción vacía, micrófono denegado): en
  // español y sin sacar al aprendiz del turno.
  const [aviso, setAviso] = useState<string | null>(null);
  const mustSpeak = !!voiceRequirement;
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
  const voice = useVoiceInput(
    (t, audioUrl) => {
      setAviso(null);
      onSend(t, audioUrl);
    },
    setAviso,
  );

  const submit = (value: string) => {
    const clean = value.trim();
    // En un turno hablado no se envía texto, venga de Enter, del botón o de
    // pegar algo en el textarea.
    if (!clean || busy || mustSpeak) return;
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
              mismo salto tipográfico `text-base md:text-[15px]`): con un tamaño
              fijo, el fantasma se desalineaba del texto bajo el breakpoint md.
              El borde vive en el contenedor; textarea y overlay van sin borde.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words px-3 py-2 text-base text-muted-foreground/60 md:text-[15px]"
            >
              <span className="invisible">{text}</span>
              {ghost}
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              // El texto del aprendiz es inglés: sin `lang` el corrector toma el
              // idioma del sistema (español) y subraya la frase entera. Con él,
              // el click derecho ofrece la palabra bien escrita (ver main/context-menu.ts).
              lang="en"
              spellCheck
              placeholder={
                mustSpeak
                  ? voiceRequirement.promptEs
                  : busy
                    ? "Emma está escribiendo…"
                    : "Escribe tu respuesta en inglés…"
              }
              disabled={busy || mustSpeak}
              rows={2}
              className="relative resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            size="icon"
            variant={voice.recording ? "destructive" : mustSpeak ? "default" : "outline"}
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
            disabled={busy || mustSpeak || !text.trim()}
            aria-label="Enviar"
          >
            <Send />
          </Button>
        </div>
        {/* Línea persistente (FR-021): atajos + recordatorio de inmersión, en
            mono. El segmento de TAB es el único condicional: anunciar un atajo
            que no hace nada es lo que dejaba al aprendiz sin saber qué era TAB. */}
        {mustSpeak && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[10px] bg-accent-soft px-3 py-2">
            <p className="mr-auto text-xs text-accent-foreground">{voiceRequirement.promptEs}</p>
            {onVoiceUnavailable && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs"
                onClick={onVoiceUnavailable}
                title="Rehabilita el teclado para el resto de la escena"
              >
                <MicOff className="h-3.5 w-3.5" /> No puedo hablar ahora
              </Button>
            )}
          </div>
        )}
        {aviso && (
          <p role="status" className="mt-2 text-xs text-destructive">
            {aviso}
          </p>
        )}
        <p className="mt-2 font-code text-[11px] tracking-wide text-muted-foreground">
          {mustSpeak ? (
            "Este turno se habla · La conversación es solo en inglés"
          ) : (
            <>
              {ghost && "TAB acepta la sugerencia · "}
              ENTER envía · La conversación es solo en inglés
            </>
          )}
        </p>
      </div>
    </div>
  );
}
