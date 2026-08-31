"use client";

/**
 * Burbuja del aprendiz: alineada a la derecha, estilo mensajería. Muestra la hora
 * y, si fue nota de voz, un reproductor del audio grabado sobre la transcripción.
 */

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "./chat-time";

function playAudio(url: string) {
  new Audio(url).play().catch(() => {});
}

export function UserBubble({ text, at, audioUrl }: { text: string; at?: number; audioUrl?: string }) {
  return (
    <div className="flex flex-col items-end duration-300 animate-in fade-in slide-in-from-bottom-1">
      <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground shadow-sm">
        {audioUrl && (
          <div className="mb-1 flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 rounded-full"
              onClick={() => playAudio(audioUrl)}
              aria-label="Reproducir nota de voz"
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
      </div>
      {at && <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">{formatTime(at)}</span>}
    </div>
  );
}
