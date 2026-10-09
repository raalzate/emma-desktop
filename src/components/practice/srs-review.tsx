"use client";

/**
 * Repaso espaciado (SRS) con recuerdo activo: las tarjetas de producción se
 * ESCRIBEN y el dominio las compara (`checkRecall`); las de sonido se
 * autoevalúan tras revelar. El andamiaje también es del dominio: consigna por
 * tipo de tarjeta (`recallPromptEs`), pista con hueco (`recallHint`) y
 * corrección palabra a palabra (`wordDiff`). Cada respuesta muestra la caja
 * Leitner y cuándo vuelve la tarjeta; al final, un resumen de la sesión.
 * `today` = días desde epoch, igual que el resto del dominio Leitner.
 */

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Layers, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlipReveal, ItemTransition } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useLessonTodos } from "@/components/lessons/use-lesson-todos";
import { awardActivities } from "@/components/gamification/award-activity";
import { Badge } from "@/components/ui/badge";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { todayAsDays } from "@/interface/today";
import type { SrsCard, SrsCardKind } from "@/domain/srs/srs-card";
import type { LeitnerBox } from "@/domain/srs/leitner";
import {
  checkRecall,
  isTeachableCard,
  isTypedRecall,
  nextReviewInDays,
  recallContext,
  recallFront,
  recallGaps,
  recallHint,
  recallPromptEs,
  recallTarget,
  summarizeReview,
  wordDiff,
  type RecallVerdict,
  type ReviewResult,
} from "@/domain/srs/recall-check";
import { startReviewSession, answerCard } from "@/application/srs/review-session-use-case";

const KIND_LABEL_ES: Record<SrsCardKind, string> = {
  "chunk-cloze": "Fill in the gap",
  "sentence-production": "Write the corrected sentence",
  "minimal-pair": "Minimal pair",
  "word-stress": "Word stress",
  collocation: "Collocation",
};

function BoxIndicator({ box }: { box: LeitnerBox }) {
  return (
    <span
      className="flex items-center gap-1 font-code text-[11px] text-muted-foreground"
      title={"Caja " + box + " de 5: cuanto más alta, más tarda en volver"}
    >
      <Layers className="h-3 w-3" />
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-3 rounded-sm ${i < box ? "bg-primary" : "bg-secondary"}`}
        />
      ))}
    </span>
  );
}

/** La respuesta correcta con las palabras que el aprendiz no acertó resaltadas. */
function CorrectionLine({ expected, given }: { expected: string; given: string }) {
  const parts = wordDiff(expected, given);
  const allOk = parts.every((p) => p.ok);
  return (
    <p className="flex flex-wrap gap-1 rounded-md bg-primary-soft p-2 text-primary">
      {parts.map((part, i) => (
        <span
          key={`${part.word}-${i}`}
          className={part.ok || allOk ? "" : "rounded bg-scaffold-hard-bg px-1 font-semibold text-scaffold-hard"}
        >
          {part.word}
        </span>
      ))}
    </p>
  );
}

type Phase = "recall" | "graded";

interface Graded {
  verdict: RecallVerdict | null;
  correct: boolean;
  inDays: number;
}

interface Props {
  runtime: EmmaRuntime;
  /** Aviso al contenedor de que el estado de las tarjetas cambió (panel «Hoy»). */
  onChange?: () => void;
}

export function SrsReview({ runtime, onChange }: Props) {
  const [cards, setCards] = useState<SrsCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("recall");
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const lessons = useLessonTodos();
  const finished = cards !== null && cards.length > 0 && index >= cards.length;

  // Repaso terminado ⇒ la lección «Review your cards» se cierra sola (#172):
  // haberla hecho es haberla hecho, sin pulsar «Done» aparte.
  useEffect(() => {
    if (finished) void lessons.completeByKind("srs-review");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const due = await startReviewSession({ repo: runtime.repos.srs, today: todayAsDays() });
      if (!alive) return;
      // Las tarjetas nacidas de una reformulación del corrector no enseñan nada.
      setCards(due.filter(isTeachableCard));
    })();
    return () => {
      alive = false;
    };
  }, [runtime]);

  useEffect(() => {
    if (phase === "recall") inputRef.current?.focus();
  }, [phase, index]);

  if (cards === null) {
    return <p className="text-sm text-muted-foreground">Loading cards…</p>;
  }

  if (cards.length === 0) {
    return (
      <Card className="rounded-bubble">
        <CardContent className="space-y-1 p-4 text-sm">
          <p className="font-medium">No cards due today.</p>
          <p className="text-muted-foreground">
            They come from your conversation mistakes and the items you miss in Exercises.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (index >= cards.length) {
    const summary = summarizeReview(results);
    return (
      <Card className="rounded-bubble">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Review done</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-headline text-4xl font-semibold text-primary">
              {summary.correct}/{summary.reviewed}
            </span>
            <div className="text-muted-foreground">
              <p>{summary.promoted} move up a box</p>
              {summary.mastered > 0 && <p>{summary.mastered} already mastered</p>}
              {summary.reset > 0 && <p>{summary.reset} go back to box 1</p>}
            </div>
          </div>
          <p>{summary.messageEs}</p>
        </CardContent>
      </Card>
    );
  }

  const current = cards[index];
  const typedMode = isTypedRecall(current.kind);

  async function grade(correct: boolean, verdict: RecallVerdict | null) {
    const inDays = nextReviewInDays(current, correct);
    await answerCard({ repo: runtime.repos.srs, cardId: current.id, correct, today: todayAsDays() });
    onChange?.();
    setResults((prev) => [...prev, { cardId: current.id, correct, fromBox: current.box }]);
    void awardActivities([{ kind: "review" }]);
    setGraded({ verdict, correct, inDays });
    setPhase("graded");
  }

  function submitTyped() {
    if (!typed.trim()) return;
    const verdict = checkRecall(current, typed);
    void grade(verdict !== "wrong", verdict);
  }

  function next() {
    setTyped("");
    setRevealed(false);
    setHinted(false);
    setGraded(null);
    setPhase("recall");
    setIndex((i) => i + 1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (phase === "recall") submitTyped();
    else next();
  }

  const verdictStyle =
    graded?.verdict === "near"
      ? "border-scaffold-mid/40 bg-scaffold-mid-bg text-scaffold-mid"
      : graded?.correct
        ? "border-scaffold-easy/40 bg-scaffold-easy-bg text-scaffold-easy"
        : "border-scaffold-hard/40 bg-scaffold-hard-bg text-scaffold-hard";

  const showAnswer = phase === "graded" || revealed;

  return (
    <ItemTransition itemKey={index}>
    <Card className="rounded-bubble">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="font-code text-[11px]">
            {KIND_LABEL_ES[current.kind]}
          </Badge>
          <div className="flex items-center gap-3">
            <BoxIndicator box={current.box} />
            <span className="text-xs text-muted-foreground">
              Card {index + 1} of {cards.length}
            </span>
          </div>
        </div>
        <Progress value={(index / cards.length) * 100} className="h-1.5" />
        <p className="text-xs text-muted-foreground">{recallPromptEs(current.kind, current)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-headline text-lg leading-snug">{recallFront(current)}</p>
        {/* Lo que el aprendiz dijo en la escena: da el sentido de la frase con huecos. */}
        {recallGaps(current) && recallContext(current) && (
          <p className="text-sm text-muted-foreground">
            You said: <span className="italic">&ldquo;{recallContext(current)}&rdquo;</span>
          </p>
        )}
        {current.sourceEs && <p className="text-xs text-muted-foreground">{current.sourceEs}</p>}

        {hinted && !showAnswer && (
          <p className="flex items-center gap-2 text-sm text-scaffold-mid">
            <Lightbulb className="h-4 w-4" />
            <span className="font-code tracking-wider">{recallHint(current)}</span>
          </p>
        )}

        {typedMode ? (
          <Input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={phase === "graded"}
            placeholder={recallGaps(current) ? "Type the missing words, or the whole sentence · Enter to check" : "Type it in English · Enter to check"}
            aria-label="Your answer"
            autoComplete="off"
          />
        ) : null}

        {showAnswer && (
          <FlipReveal>
            {typedMode && graded && !graded.correct ? (
              <CorrectionLine expected={recallTarget(current, typed)} given={typed} />
            ) : (
              <p className="rounded-md bg-primary-soft p-2 text-primary">{current.back}</p>
            )}
          </FlipReveal>
        )}

        {graded && (
          <div className={`rounded-bubble border p-3 text-sm ${verdictStyle}`}>
            <p className="font-medium">
              {graded.verdict === "near"
                ? "Almost exact: it counts, but mind the form."
                : graded.correct
                  ? "You've got it."
                  : "Not yet. The highlighted words are the ones you missed."}
            </p>
            <p className="text-muted-foreground">
              {graded.correct
                ? `Back in ${graded.inDays} day(s).`
                : "Back tomorrow in box 1."}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {phase === "recall" && typedMode && !revealed && (
            <>
              <Button title="Comprueba tu respuesta" onClick={submitTyped} disabled={!typed.trim()}>
                Check
              </Button>
              <Button variant="outline" title="Muestra la primera letra y el largo de cada palabra que falta" onClick={() => setHinted(true)} disabled={hinted} className="gap-1">
                <Lightbulb className="h-4 w-4" /> Hint
              </Button>
            </>
          )}
          {phase === "recall" && !typedMode && !revealed && (
            <Button title="Revela la respuesta; después calificá si la sabías" onClick={() => setRevealed(true)}>Show answer</Button>
          )}
          {phase === "recall" && revealed && (
            <>
              <Button variant="destructive" title="La tarjeta vuelve a la caja 1" onClick={() => grade(false, null)}>
                I missed it
              </Button>
              <Button title="La tarjeta sube de caja y vuelve más tarde" onClick={() => grade(true, null)}>I knew it</Button>
            </>
          )}
          {phase === "recall" && typedMode && !revealed && (
            <Button variant="ghost" title="Revela la respuesta sin penalizarte todavía" onClick={() => setRevealed(true)}>
              I don't remember
            </Button>
          )}
          {phase === "graded" && (
            <Button title={index + 1 < cards.length ? "Pasa a la siguiente tarjeta" : "Muestra el resumen del repaso"} onClick={next} className="gap-1">
              {index + 1 < cards.length ? "Next" : "See summary"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
    </ItemTransition>
  );
}
