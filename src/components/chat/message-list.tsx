"use client";

/** Lista desplazable de burbujas; auto-scroll al último mensaje o token. */

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmmaBubble } from "./emma-bubble";
import { UserBubble } from "./user-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { ChatTurn } from "@/domain/chat/simulation-session";
import type { VoiceGender } from "@/domain/chat-settings/chat-settings";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import type { Protopersona } from "@/domain/personas/protopersona";
import { SceneNarration } from "./scene-narration";

interface Props {
  messages: ChatTurn[];
  /** El personaje tiene el turno: muestra "escribiendo…" (no se revela el texto en crudo). */
  typing: boolean;
  gender?: VoiceGender;
  /** Protopersona de la escena: identidad visual y voz de las burbujas del agente. */
  persona?: Protopersona;
  scenario?: Scenario;
  situation?: SituationVariant | null;
  /** Escena recién empezada: la narración se teclea. Falso al reabrir del histórico. */
  narrate?: boolean;
  onTeach: (text: string) => void;
  onTranslate: (text: string) => void;
}

export function MessageList({
  messages, typing, gender, persona, scenario, situation, narrate = true, onTeach, onTranslate,
}: Props) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
        {scenario && (
          <SceneNarration scenario={scenario} situation={situation} animate={narrate} />
        )}
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <EmmaBubble
              key={i}
              text={m.content}
              at={m.at}
              gender={gender}
              persona={persona}
              onTeach={() => onTeach(m.content)}
              onTranslate={() => onTranslate(m.content)}
            />
          ) : (
            <UserBubble key={i} text={m.content} at={m.at} audioUrl={m.audioUrl} />
          ),
        )}
        {typing && <TypingIndicator />}
        <div ref={end} />
      </div>
    </ScrollArea>
  );
}
