"use client";

/**
 * Botón compacto para escuchar la pronunciación de un texto en inglés. Reutiliza
 * el motor TTS (Edge-TTS con caída a Web Speech) vía useKaraoke. Sin karaoke: sólo
 * reproduce/detiene. Se usa en las filas del panel Teach me y en Translate.
 */

import { Loader2, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKaraoke } from "./use-karaoke";
import type { VoiceGender } from "@/domain/chat-settings/chat-settings";

export function SpeakButton({ text, gender }: { text: string; gender?: VoiceGender }) {
  const k = useKaraoke(text, gender);
  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7 shrink-0 rounded-full text-primary"
      onClick={() => (k.playing ? k.stop() : k.play())}
      disabled={!k.available || k.loading}
      aria-label={k.playing ? "Detener" : "Escuchar pronunciación"}
    >
      {k.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : k.playing ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  );
}
