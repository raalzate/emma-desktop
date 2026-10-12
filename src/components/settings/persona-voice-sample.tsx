"use client";

/**
 * Muestra de voz de una protopersona en Settings: botón para oírla, badge con
 * la voz asignada y, tras reproducir, el motor que realmente sonó. La vista es
 * presentacional (props) para probarla sin DOM; el contenedor cablea useKaraoke.
 */

import { Loader2, Square, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useKaraoke, type Karaoke } from "@/components/chat/use-karaoke";
import type { Protopersona } from "@/domain/personas/protopersona";
import { describePersonaVoice, voiceSampleText } from "@/domain/personas/voice-sample";

const ENGINE_LABELS: Record<NonNullable<Karaoke["engine"]>, string> = {
  kokoro: "Kokoro (on this device)",
  system: "System voice",
};

export function engineLabel(engine: Karaoke["engine"]): string | null {
  return engine ? ENGINE_LABELS[engine] : null;
}

interface ViewProps {
  persona: Protopersona;
  engine: Karaoke["engine"];
  playing: boolean;
  loading: boolean;
  available: boolean;
  onToggle(): void;
}

export function PersonaVoiceSampleView({ persona, engine, playing, loading, available, onToggle }: ViewProps) {
  const voice = describePersonaVoice(persona);
  const played = engineLabel(engine);
  const icon = loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : playing ? (
    <Square className="h-4 w-4" />
  ) : (
    <Volume2 className="h-4 w-4" />
  );
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="gap-2"
        title={playing ? "Detén la muestra de voz" : "Escucha cómo suena la voz de este personaje"}
        onClick={onToggle}
        disabled={!available || loading}
      >
        {icon}
        {playing ? "Stop" : "Play voice sample"}
      </Button>
      <Badge
        variant="outline"
        className="text-[10px]"
        title="Voz local asignada a este personaje: motor, identificador y acento"
      >
        {`Kokoro · ${voice.kokoroVoice} · ${voice.accent}`}
      </Badge>
      {played && <span className="text-xs text-muted-foreground">{`Played with: ${played}`}</span>}
    </div>
  );
}

export function PersonaVoiceSample({ persona }: { persona: Protopersona }) {
  const k = useKaraoke(voiceSampleText(persona), persona.voice, persona.ttsVoice);
  return (
    <PersonaVoiceSampleView
      persona={persona}
      engine={k.engine}
      playing={k.playing}
      loading={k.loading}
      available={k.available}
      onToggle={() => (k.playing ? k.stop() : k.play())}
    />
  );
}
