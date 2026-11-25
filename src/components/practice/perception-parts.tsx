"use client";

/**
 * Piezas del laboratorio de pares mínimos (#357): la oración con la palabra
 * oculta hasta responder, la palabra revelada con su IPA, el botón de grabar
 * con sus tres estados y el resumen de la ronda con acciones siguientes.
 * Sólo presentación: todo entra por props.
 */

import { ArrowRight, Loader2, Mic, RotateCcw, Square, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { maskWord, roundVerdict } from "@/domain/phonetics/perception-feedback";

export type AttemptState = "idle" | "recording" | "transcribing" | "error";

/** La oración con la palabra objetivo oculta: escuchar ES la tarea. */
export function MaskedSentence({ sentence, word }: { sentence: string; word: string }) {
  const parts = maskWord(sentence, word);
  if (!parts) return <p className="text-sm">{sentence}</p>;
  return (
    <p className="text-sm">
      {parts.before}
      <span
        data-testid="masked-word"
        aria-label="Hidden word"
        title="Palabra oculta: escúchala y elige cuál oíste"
        className="mx-0.5 inline-block min-w-12 rounded bg-muted px-2 align-baseline font-code tracking-widest text-muted-foreground"
      >
        _____
      </span>
      {parts.after}
    </p>
  );
}

/** La oración con la palabra revelada y su pronunciación fonética. */
export function RevealedWord({ sentence, word, ipa }: { sentence: string; word: string; ipa?: string }) {
  const parts = maskWord(sentence, word);
  return (
    <div className="space-y-1">
      <p className="text-sm">
        {parts ? (
          <>
            {parts.before}
            <strong className="text-primary">{sentence.slice(parts.before.length, sentence.length - parts.after.length)}</strong>
            {parts.after}
          </>
        ) : (
          sentence
        )}
      </p>
      {ipa && (
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{word}</span>{" "}
          <span className="font-code">{ipa}</span>
        </p>
      )}
    </div>
  );
}

interface AttemptButtonProps {
  state: AttemptState;
  idleLabel: string;
  /** Tooltip en español del estado de reposo. */
  title: string;
  onClick: () => void;
}

/** Grabar → detener y comprobar → procesando: cada estado se ve y se nombra. */
export function AttemptButton({ state, idleLabel, title, onClick }: AttemptButtonProps) {
  if (state === "transcribing") {
    return (
      <Button size="sm" variant="outline" disabled title="Procesando tu grabación" className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking…
      </Button>
    );
  }
  if (state === "recording") {
    return (
      <Button
        size="sm"
        variant="destructive"
        onClick={onClick}
        title="Detiene la grabación y comprueba tu pronunciación"
        className="gap-2"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <Square className="h-3.5 w-3.5" />
        Stop and check
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" onClick={onClick} title={title} className="gap-2">
      <Mic className="h-4 w-4" />
      {idleLabel}
    </Button>
  );
}

interface RoundSummaryProps {
  score: { correct: number; total: number; weakPairs: string[] };
  onRetry: () => void;
  onNextSound: () => void;
  onShadowing: () => void;
}

const TONE_CLASS = {
  great: "text-scaffold-easy",
  good: "text-primary",
  keep: "text-scaffold-hard",
} as const;

/** Resultado de la ronda con lectura y siguiente paso (antes: «Correct: 10 of 10» y nada más). */
export function RoundSummary({ score, onRetry, onNextSound, onShadowing }: RoundSummaryProps) {
  const verdict = roundVerdict(score);
  return (
    <div className="space-y-4 rounded-bubble border border-border bg-card p-5">
      <div className="flex items-baseline gap-3">
        <span className={`font-headline text-4xl font-bold ${TONE_CLASS[verdict.tone]}`}>{verdict.percent}%</span>
        <span className="text-sm text-muted-foreground">
          {score.correct} of {score.total} correct
        </span>
      </div>
      <p className="font-medium">{verdict.headline}</p>
      {score.weakPairs.length > 0 && (
        <p className="text-sm text-muted-foreground">Words to reinforce: {score.weakPairs.join(", ")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onRetry} title="Repite una ronda nueva con este mismo sonido" className="gap-2">
          <RotateCcw className="h-4 w-4" /> Practice again
        </Button>
        <Button size="sm" onClick={onNextSound} title="Pasa al siguiente par de sonidos" className="gap-2">
          Next sound <ArrowRight className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={onShadowing} title="Practica frases completas repitiendo a la par del audio" className="gap-2">
          <Waves className="h-4 w-4" /> Go to shadowing
        </Button>
      </div>
    </div>
  );
}
