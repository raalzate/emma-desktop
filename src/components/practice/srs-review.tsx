"use client";

/**
 * Repaso espaciado (SRS) con recuerdo activo: las tarjetas de producción se
 * ESCRIBEN y el dominio las compara (`checkRecall`); las de sonido se
 * autoevalúan tras revelar. Cada respuesta muestra la caja Leitner y cuándo
 * vuelve la tarjeta; al final, un resumen de la sesión. `today` = días desde
 * epoch, igual que el resto del dominio Leitner (sin Date oculto).
 */

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { todayAsDays } from "@/interface/today";
import type { SrsCard, SrsCardKind } from "@/domain/srs/srs-card";
import type { LeitnerBox } from "@/domain/srs/leitner";
import {
  checkRecall,
  isTypedRecall,
  nextReviewInDays,
  summarizeReview,
  type RecallVerdict,
  type ReviewResult,
} from "@/domain/srs/recall-check";
import { startReviewSession, answerCard } from "@/application/srs/review-session-use-case";

const KIND_LABEL_ES: Record<SrsCardKind, string> = {
  "chunk-cloze": "Completar el chunk",
  "sentence-production": "Producir la frase",
  "minimal-pair": "Par mínimo",
  "word-stress": "Acento de palabra",
  collocation: "Colocación",
};

function BoxIndicator({ box }: { box: LeitnerBox }) {
  return (
    <span className="flex items-center gap-1 font-code text-[11px] text-muted-foreground" title={`Caja ${box} de 5`}>
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
  const [graded, setGraded] = useState<Graded | null>(null);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const due = await startReviewSession({ repo: runtime.repos.srs, today: todayAsDays() });
      if (!alive) return;
      setCards(due);
    })();
    return () => {
      alive = false;
    };
  }, [runtime]);

  useEffect(() => {
    if (phase === "recall") inputRef.current?.focus();
  }, [phase, index]);

  if (cards === null) {
    return <p className="text-sm text-muted-foreground">Cargando tarjetas…</p>;
  }

  if (cards.length === 0) {
    return (
      <Card className="rounded-bubble">
        <CardContent className="space-y-1 p-4 text-sm">
          <p className="font-medium">Sin tarjetas pendientes hoy.</p>
          <p className="text-muted-foreground">
            Se crean con tus errores de conversación y con los ítems que fallas en Ejercicios.
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
          <CardTitle className="font-headline text-lg">Repaso terminado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-headline text-4xl font-semibold text-primary">
              {summary.correct}/{summary.reviewed}
            </span>
            <div className="text-muted-foreground">
              <p>{summary.promoted} suben de caja</p>
              {summary.mastered > 0 && <p>{summary.mastered} ya dominadas</p>}
              {summary.reset > 0 && <p>{summary.reset} vuelven a la caja 1</p>}
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

  return (
    <Card className="rounded-bubble">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="font-code text-[11px]">
            {KIND_LABEL_ES[current.kind]}
          </Badge>
          <div className="flex items-center gap-3">
            <BoxIndicator box={current.box} />
            <span className="text-xs text-muted-foreground">
              {index + 1} / {cards.length}
            </span>
          </div>
        </div>
        <Progress value={(index / cards.length) * 100} className="h-1.5" />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-headline text-lg leading-snug">{current.front}</p>
        {current.sourceEs && <p className="text-xs text-muted-foreground">{current.sourceEs}</p>}

        {typedMode ? (
          <Input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={phase === "graded"}
            placeholder="Escríbelo en inglés · Enter para comprobar"
            aria-label="Tu respuesta"
            autoComplete="off"
          />
        ) : null}

        {(phase === "graded" || revealed) && (
          <p className="rounded-md bg-primary-soft p-2 text-primary">{current.back}</p>
        )}

        {graded && (
          <div className={`rounded-bubble border p-3 text-sm ${verdictStyle}`}>
            <p className="font-medium">
              {graded.verdict === "near"
                ? "Casi exacta: cuenta, pero fíjate en la forma."
                : graded.correct
                  ? "La tienes."
                  : "Todavía no."}
            </p>
            <p className="text-muted-foreground">
              {graded.correct
                ? `Vuelve en ${graded.inDays} día(s).`
                : "Vuelve mañana a la caja 1."}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {phase === "recall" && typedMode && !revealed && (
            <Button onClick={submitTyped} disabled={!typed.trim()}>
              Comprobar
            </Button>
          )}
          {phase === "recall" && !typedMode && !revealed && (
            <Button onClick={() => setRevealed(true)}>Mostrar respuesta</Button>
          )}
          {phase === "recall" && revealed && (
            <>
              <Button variant="destructive" onClick={() => grade(false, null)}>
                Fallé
              </Button>
              <Button onClick={() => grade(true, null)}>La supe</Button>
            </>
          )}
          {phase === "recall" && typedMode && !revealed && (
            <Button variant="ghost" onClick={() => setRevealed(true)}>
              No la recuerdo
            </Button>
          )}
          {phase === "graded" && (
            <Button onClick={next} className="gap-1">
              {index + 1 < cards.length ? "Siguiente" : "Ver resumen"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
