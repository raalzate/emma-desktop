"use client";

/**
 * Tarjeta de repaso en modo audio (H2): Listen → Write → Read aloud en una
 * sola vista. Presentacional: el audio entra por adaptadores inyectables
 * (`ClipPlayer`, `ClipRecorder`) y el resultado sale por `onGrade`.
 * El texto objetivo no está en el DOM hasta enviar el dictado (FR-012).
 * `AudioRecallView` es la vista pura por estado; `AudioRecallCard` guarda el estado.
 */

import { useReducer } from "react";
import { ArrowRight, Mic, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CorrectionLine } from "@/components/practice/correction-line";
import { AbPlayer } from "@/components/practice/ab-player";
import type { SrsCard } from "@/domain/srs/srs-card";
import { presentAudioCard, type RecallVerdict } from "@/domain/srs/recall-check";
import {
  audioRecallReducer,
  gradeOf,
  initialAudioRecallState,
  playbackRateFor,
  stepsFor,
  type AudioRecallAction,
  type AudioRecallState,
  type AudioStep,
  type DictationResult,
  type PlaybackRate,
} from "@/components/practice/audio-recall-state";

export type { AudioStep, PlaybackRate, DictationResult };
export type AudioRecallViewState = AudioRecallState;

/** Puerto de reproducción: el contenedor lo cablea con `HTMLAudioElement`. */
export interface ClipPlayer {
  play(url: string, rate: PlaybackRate): void;
  stop(): void;
}

/** Puerto de grabación del intento de lectura; devuelve la URL del intento. */
export interface ClipRecorder {
  start(): Promise<void>;
  stop(): Promise<{ url: string }>;
}

export interface AudioRecallHandlers {
  onReplay: () => void;
  onRate: (rate: PlaybackRate) => void;
  onGoWrite: () => void;
  onTyped: (text: string) => void;
  onSubmit: () => void;
  onGoRead: () => void;
  onRecord: () => void;
  onStopRecord: () => void;
  onPlayReference: () => void;
  onPlayAttempt: () => void;
  onFinish: () => void;
}

const STEP_LABEL: Record<AudioStep, string> = { listen: "Listen", write: "Write", read: "Read aloud" };

const VERDICT_TEXT: Record<RecallVerdict, string> = {
  correct: "Correct",
  near: "Almost: it counts, but mind the form.",
  wrong: "Not yet. The highlighted words are the ones you missed.",
};

const VERDICT_STYLE: Record<RecallVerdict, string> = {
  correct: "border-scaffold-easy/40 bg-scaffold-easy-bg text-scaffold-easy",
  near: "border-scaffold-mid/40 bg-scaffold-mid-bg text-scaffold-mid",
  wrong: "border-scaffold-hard/40 bg-scaffold-hard-bg text-scaffold-hard",
};

function Stepper({ steps, current }: { steps: AudioStep[]; current: AudioStep }) {
  const position = steps.indexOf(current) + 1;
  return (
    <div className="space-y-2">
      <ol className="flex items-center gap-2" aria-label="Review steps">
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={s === current ? "step" : undefined}
            className={`flex items-center gap-1 text-xs ${s === current ? "font-semibold text-primary" : "text-muted-foreground"}`}
          >
            <span className="font-code">{i + 1}.</span>
            <span>{STEP_LABEL[s]}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Step {position} of {steps.length}: {STEP_LABEL[current]}
      </p>
    </div>
  );
}

function ListenStep({ state, h }: { state: AudioRecallViewState; h: AudioRecallHandlers }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button className="gap-1" title="Reproduce el clip otra vez" aria-label="Play again" onClick={h.onReplay}>
          <Play className="h-4 w-4" /> Play again
        </Button>
        {([1, 0.75] as const).map((r) => (
          <Button
            key={r}
            variant={state.rate === r ? "secondary" : "outline"}
            aria-pressed={state.rate === r}
            title={r === 1 ? "Velocidad normal" : "Velocidad reducida para oír mejor"}
            aria-label={`Speed ${r}x`}
            onClick={() => h.onRate(r)}
          >
            {r}x
          </Button>
        ))}
      </div>
      <Button className="gap-1" title="Pasa a escribir lo que oíste" aria-label="Continue to write" onClick={h.onGoWrite}>
        Write it <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function WriteStep({
  state,
  h,
  hint,
  canListen,
}: {
  state: AudioRecallViewState;
  h: AudioRecallHandlers;
  hint: string | null;
  canListen: boolean;
}) {
  const { result } = state;
  return (
    <div className="space-y-3">
      {hint && <p className="font-code text-sm tracking-wider text-scaffold-mid">{hint}</p>}
      {canListen && (
        <Button variant="outline" className="gap-1" title="Vuelve a escuchar el clip sin ver el texto" aria-label="Listen again" onClick={h.onReplay}>
          <Play className="h-4 w-4" /> Listen again
        </Button>
      )}
      <Input
        value={state.typed}
        onChange={(e) => h.onTyped(e.target.value)}
        disabled={result !== null}
        placeholder="Type what you heard · Enter to check"
        aria-label="Your dictation"
        autoComplete="off"
      />
      {result && (
        <div className="space-y-2" aria-live="polite">
          <CorrectionLine expected={result.expected} given={state.typed} />
          <p className={`rounded-bubble border p-3 text-sm font-medium ${VERDICT_STYLE[result.verdict]}`}>
            {VERDICT_TEXT[result.verdict]}
          </p>
        </div>
      )}
      {result ? (
        <Button className="gap-1" title="Pasa a leer la frase en voz alta" aria-label="Go to read aloud" onClick={h.onGoRead}>
          Read aloud <ArrowRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          title="Comprueba tu dictado"
          aria-label="Check dictation"
          onClick={h.onSubmit}
          disabled={!state.typed.trim()}
        >
          Check
        </Button>
      )}
    </div>
  );
}

function ReadStep({ state, h }: { state: AudioRecallViewState; h: AudioRecallHandlers }) {
  return (
    <div className="space-y-3">
      {state.result && <p className="rounded-md bg-primary-soft p-2 text-primary">{state.result.expected}</p>}
      <div className="flex flex-wrap gap-2">
        {state.recording ? (
          <Button variant="destructive" className="gap-1" title="Detiene la grabación" aria-label="Stop recording" onClick={h.onStopRecord}>
            <Square className="h-4 w-4" /> Stop
          </Button>
        ) : (
          <Button variant="outline" className="gap-1" title="Graba tu lectura en voz alta" aria-label="Record your reading" onClick={h.onRecord}>
            <Mic className="h-4 w-4" /> Record
          </Button>
        )}
      </div>
      <AbPlayer attemptUrl={state.attemptUrl} onPlayReference={h.onPlayReference} onPlayAttempt={h.onPlayAttempt} />
      <Button className="gap-1" title="Termina la tarjeta y guarda el resultado" aria-label="Finish card" onClick={h.onFinish}>
        Finish <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ViewProps {
  card: Pick<SrsCard, "kind" | "front" | "back">;
  clipUrl: string | null;
  state: AudioRecallViewState;
  handlers: AudioRecallHandlers;
}

export function AudioRecallView({ card, clipUrl, state, handlers }: ViewProps) {
  const presentation = presentAudioCard(card, clipUrl !== null);
  const steps = stepsFor(presentation.mode === "audio");
  const prompt = presentation.mode === "audio" ? card.front : presentation.front;
  const hint = presentation.mode === "text" ? presentation.hint : null;
  return (
    <Card className="rounded-bubble">
      <CardHeader className="space-y-3">
        <Badge variant="secondary" className="w-fit font-code text-[11px]">
          Listen and type
        </Badge>
        <Stepper steps={steps} current={state.step} />
        <p className="font-headline text-lg leading-snug">{prompt}</p>
      </CardHeader>
      <CardContent>
        {state.step === "listen" && <ListenStep state={state} h={handlers} />}
        {state.step === "write" && <WriteStep state={state} h={handlers} hint={hint} canListen={presentation.mode === "audio"} />}
        {state.step === "read" && <ReadStep state={state} h={handlers} />}
      </CardContent>
    </Card>
  );
}

interface Props {
  card: SrsCard;
  /** URL del clip guardado; null = perdido o borrado (se degrada a texto). */
  clipUrl: string | null;
  player: ClipPlayer;
  recorder: ClipRecorder;
  /** Resultado del dictado: el contenedor lo pasa a `answerCard`. */
  onGrade: (correct: boolean, verdict: RecallVerdict) => void;
}

export function AudioRecallCard({ card, clipUrl, player, recorder, onGrade }: Props) {
  const [state, dispatch] = useReducer(
    (st: AudioRecallState, action: AudioRecallAction) => audioRecallReducer(card, st, action),
    clipUrl !== null,
    initialAudioRecallState,
  );

  function play(url: string | null) {
    if (url) player.play(url, playbackRateFor(state.step, state.rate));
  }

  async function stopRecording() {
    const attempt = await recorder.stop();
    dispatch({ type: "recordStopped", url: attempt.url });
  }

  function finish() {
    const grade = gradeOf(state);
    if (grade) onGrade(grade.correct, grade.verdict);
  }

  return (
    <AudioRecallView
      card={card}
      clipUrl={clipUrl}
      state={state}
      handlers={{
        onReplay: () => play(clipUrl),
        onRate: (rate) => dispatch({ type: "rate", rate }),
        onGoWrite: () => {
          player.stop();
          dispatch({ type: "goWrite" });
        },
        onTyped: (text) => dispatch({ type: "typed", text }),
        onSubmit: () => dispatch({ type: "submit" }),
        onGoRead: () => dispatch({ type: "goRead" }),
        onRecord: () => {
          player.stop();
          void recorder.start().then(() => dispatch({ type: "recordStarted" }));
        },
        onStopRecord: () => void stopRecording(),
        onPlayReference: () => play(clipUrl),
        onPlayAttempt: () => play(state.attemptUrl),
        onFinish: finish,
      }}
    />
  );
}
