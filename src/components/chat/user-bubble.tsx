"use client";

/**
 * Burbuja del aprendiz: alineada a la derecha, estilo mensajería. Muestra la hora
 * y, si fue nota de voz, un reproductor del audio grabado sobre la transcripción.
 */

import { CheckCheck, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "./chat-time";

function playAudio(url: string) {
  new Audio(url).play().catch(() => {});
}

export function UserBubble({ text, at, audioUrl }: { text: string; at?: number; audioUrl?: string }) {
  return (
    <div className="flex justify-end duration-300 animate-in fade-in slide-in-from-bottom-1">
      {/* Azul primary con esquina inferior derecha 4px (FR-018); abraza el
          texto y lleva la hora dentro, estilo mensajería. */}
      <div className="w-fit max-w-[75%] whitespace-pre-wrap rounded-bubble rounded-br-[4px] bg-primary px-3 py-1.5 text-sm text-primary-foreground shadow-[0_1px_2px_rgba(31,41,51,0.08)]">
        {audioUrl && (
          <div className="mb-1 flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 rounded-full"
              title="Vuelve a escuchar tu nota de voz para comparar tu pronunciación"
              onClick={() => playAudio(audioUrl)}
              aria-label="Play voice note"
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
            <div className="flex h-5 flex-1 items-center gap-0.5" aria-hidden>
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="w-0.5 rounded bg-primary-foreground/50"
                  style={{ height: `${25 + ((i * 41) % 55)}%` }}
                />
              ))}
            </div>
          </div>
        )}
        {text}
        {/* Hora + doble check al final de la línea, como «enviado». */}
        <span className="ml-2 inline-flex translate-y-0.5 items-center gap-0.5 whitespace-nowrap font-code text-[10px] text-primary-foreground/70">
          {at ? formatTime(at) : ""}
          <CheckCheck className="h-3 w-3" aria-label="Sent" />
        </span>
      </div>
    </div>
  );
}
