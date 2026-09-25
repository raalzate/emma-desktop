"use client";

/**
 * Transcripción con karaoke, compartida por las burbujas del chat y la lección
 * de cierre (#171). La oración activa se resalta como bloque (contexto) y la
 * palabra que suena con contraste real — el fondo suave por sí solo no se
 * percibía en mensajes de una o dos oraciones.
 *
 * Cada oración con audio es clicable para repetirla (FR-010/011); las sin audio
 * (solo símbolos) se muestran pero no reaccionan al clic. Con Web Speech no hay
 * salto por oración (`seekable = false`): el resalte sigue, el clic no.
 */

import { cn } from "@/lib/utils";
import { sentenceWordTokens, type SentenceSpan } from "@/domain/chat/transcript-sentences";

interface Props {
  sentences: SentenceSpan[];
  /** Índice de la oración que suena, -1 si ninguna. */
  active: number;
  /** Índice global de la palabra que suena, -1 si ninguna. */
  activeWord: number;
  onPick: (i: number) => void;
  /** El motor permite saltar al inicio de una oración (Edge-TTS sí, Web Speech no). */
  seekable?: boolean;
  className?: string;
}

export function KaraokeTranscript({
  sentences,
  active,
  activeWord,
  onPick,
  seekable = true,
  className,
}: Props) {
  return (
    <p className={cn("mt-2 text-[15px] leading-relaxed", className)}>
      {sentences.map((s, i) => {
        const clickable = seekable && s.wordCount > 0;
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
              clickable && "cursor-pointer hover:bg-primary-soft/60",
              i === active && "bg-primary-soft text-primary-deep",
            )}
          >
            {sentenceWordTokens(s).map((w, j) => (
              <span
                key={j}
                className={cn(
                  "rounded px-0.5 transition-colors",
                  w.wordIndex !== null &&
                    w.wordIndex === activeWord &&
                    "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {w.text}{" "}
              </span>
            ))}
          </span>
        );
      })}
    </p>
  );
}
