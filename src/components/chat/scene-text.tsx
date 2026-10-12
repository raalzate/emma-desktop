"use client";

/**
 * Texto de la escena con sus frases clave resaltadas (persona, hora, sistema):
 * la franja se lee de un vistazo en vez de como un párrafo plano.
 */

import { useMemo } from "react";
import { highlightScenePhrases } from "@/domain/chat/scene-highlights";

interface Props {
  text: string;
  /** Nombre que siempre cuenta como clave (la persona de la escena). */
  name?: string;
}

export function SceneText({ text, name }: Props) {
  const segments = useMemo(() => highlightScenePhrases(text, name ? [name] : []), [text, name]);
  return (
    <>
      {segments.map((s, i) =>
        s.key ? (
          <mark
            key={i}
            className="rounded-[3px] bg-accent/15 px-0.5 font-semibold not-italic text-foreground"
          >
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}
