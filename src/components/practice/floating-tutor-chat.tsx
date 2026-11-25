"use client";

/**
 * Chat flotante con EMMA en la práctica (#357, T8): abajo a la derecha, para
 * pedirle que traduzca o explique algo sin salir del ejercicio. Responde en
 * texto; con «Read replies aloud» también lee cada respuesta con la voz de
 * Emma. Sólo presentación: la pregunta viaja por `ask` (caso de uso askTutor).
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useKaraoke } from "@/components/chat/use-karaoke";
import { SpeakButton } from "@/components/chat/speak-button";
import { EMMA_VOICE } from "@/domain/tts/kokoro-voice";
import type { TutorTurn } from "@/domain/tutor/tutor-chat";

interface Props {
  ask: (question: string, history: TutorTurn[]) => Promise<string | null>;
  /** Sólo para pruebas: arranca abierto. */
  initialOpen?: boolean;
}

/** Una respuesta de Emma; si la lectura en voz alta está activa, suena sola al llegar. */
function TutorReply({ text, autoPlay }: { text: string; autoPlay: boolean }) {
  const karaoke = useKaraoke(text, "feminine", EMMA_VOICE);
  const played = useRef(false);
  useEffect(() => {
    if (!autoPlay || played.current || !karaoke.available) return;
    played.current = true;
    void karaoke.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, karaoke.available]);
  return (
    <div className="flex items-start gap-1">
      <p className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">{text}</p>
      <SpeakButton text={text} />
    </div>
  );
}

export function FloatingTutorChat({ ask, initialOpen = false }: Props) {
  const [open, setOpen] = useState(initialOpen);
  const [turns, setTurns] = useState<TutorTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const question = draft.trim();
    if (!question || busy) return;
    const history = turns;
    setTurns([...history, { role: "user", content: question }]);
    setDraft("");
    setBusy(true);
    const reply = await ask(question, history);
    setBusy(false);
    if (reply) setTurns((t) => [...t, { role: "assistant", content: reply }]);
  }

  if (!open) {
    return (
      <Button
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg"
        size="icon"
        aria-label="Ask EMMA"
        title="Pregúntale a EMMA: que te traduzca o te explique algo"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex h-[28rem] w-[22rem] flex-col rounded-bubble border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <p className="font-semibold">Ask EMMA</p>
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Cierra el chat con EMMA" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {turns.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask EMMA to translate or explain anything from your practice — a word, a sentence, a grammar point.
          </p>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
              {t.content}
            </p>
          ) : (
            <TutorReply key={i} text={t.content} autoPlay={readAloud && i === turns.length - 1} />
          ),
        )}
        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> EMMA is thinking…
          </p>
        )}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="space-y-2 border-t p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) void send(e);
          }}
          placeholder="Ask EMMA to translate or explain…"
          rows={2}
          maxLength={800}
          className="resize-none text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="tutor-read-aloud"
              checked={readAloud}
              onCheckedChange={(v) => setReadAloud(v === true)}
              title="Además del texto, EMMA lee cada respuesta en voz alta"
            />
            <Label htmlFor="tutor-read-aloud" className="text-xs">
              Read replies aloud
            </Label>
          </div>
          <Button type="submit" size="sm" className="gap-1" disabled={busy || !draft.trim()} title="Envía tu pregunta a EMMA">
            <Send className="h-4 w-4" /> Send
          </Button>
        </div>
      </form>
    </div>
  );
}
