"use client";

/**
 * Tab "Retos": los 72 retos del libro (paso 7, output forzado). Selector de
 * unidad → lista con estado → detalle con la rúbrica como checklist de
 * autoevaluación, contador de palabras, entrega anterior y "opinión de Emma"
 * (revisión del LLM criterio a criterio + versión mejorada) antes de marcar
 * el reto como hecho. La preparación de la entrega la decide el dominio
 * (`challenge-readiness`).
 */

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { challengesForUnit } from "@/domain/curriculum/challenge-selection";
import { challengeReadiness } from "@/domain/curriculum/challenge-readiness";
import type { ChallengeSubmission } from "@/domain/curriculum/i-challenge-repository";
import type { UnitChallenge, ChallengeMode } from "@/domain/curriculum/unit";
import { ALL_UNITS } from "@/lib/curriculum-data";
import {
  getChallengeProgress,
  submitChallenge,
} from "@/application/challenges/complete-challenge-use-case";
import {
  reviewChallenge,
  type ChallengeReview,
} from "@/application/challenges/review-challenge-use-case";
import { createChallengeRepository } from "@/infrastructure/persistence/challenge-repository";
import type { EmmaRuntime } from "@/interface/emma-runtime";

const AVAILABLE_UNITS = ALL_UNITS.map((u) => u.number).sort((a, b) => a - b);

const MODE_LABEL_ES: Record<ChallengeMode, string> = {
  written: "Escrito",
  oral: "En voz alta",
  "real-work": "En tu trabajo real",
  memorization: "Memorización",
};

function unitLabel(unitNumber: number): string {
  const unit = ALL_UNITS.find((u) => u.number === unitNumber);
  return unit ? `Unidad ${unitNumber} · ${unit.title}` : `Unidad ${unitNumber}`;
}

function EmmaReview({ review, criteria }: { review: ChallengeReview; criteria: string[] }) {
  return (
    <div className="space-y-3 rounded-bubble border border-accent/40 bg-accent-soft p-3 text-sm">
      <p className="font-code text-[11px] uppercase tracking-wide text-accent">Emma opina</p>
      <ul className="space-y-1">
        {criteria.map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                review.criteriaMet[i] ? "bg-scaffold-easy text-white" : "bg-scaffold-hard-bg text-scaffold-hard"
              }`}
            >
              {review.criteriaMet[i] ? <Check className="h-3 w-3" /> : "·"}
            </span>
            <span className={review.criteriaMet[i] ? "" : "text-muted-foreground"}>{c}</span>
          </li>
        ))}
      </ul>
      {review.commentEs && <p>{review.commentEs}</p>}
      {review.improved && (
        <div className="space-y-1">
          <p className="font-code text-[11px] uppercase tracking-wide text-muted-foreground">
            Versión mejorada
          </p>
          <p className="rounded-md bg-card p-2 font-body text-foreground">{review.improved}</p>
        </div>
      )}
    </div>
  );
}

interface ChallengeDetailProps {
  challenge: UnitChallenge;
  completed: boolean;
  previous: ChallengeSubmission | null;
  runtime: EmmaRuntime;
  onSubmitted: () => void;
  onExit: () => void;
}

function ChallengeDetail({ challenge, completed, previous, runtime, onSubmitted, onExit }: ChallengeDetailProps) {
  const [text, setText] = useState(previous?.text ?? "");
  const [checked, setChecked] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<ChallengeReview | null | "failed">(null);
  const repo = useMemo(() => createChallengeRepository(), []);

  const readiness = challengeReadiness(challenge, text, checked);

  function toggleCriterion(index: number, value: boolean) {
    setChecked((prev) => (value ? [...prev, index] : prev.filter((i) => i !== index)));
  }

  async function askEmma() {
    setReviewing(true);
    setReview(null);
    try {
      const result = await reviewChallenge({ llm: runtime.llm, challenge, text });
      setReview(result ?? "failed");
    } catch {
      setReview("failed");
    } finally {
      setReviewing(false);
    }
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await submitChallenge({ repo, challengeId: challenge.id, text });
      onSubmitted();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-bubble">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="font-headline text-lg">Reto {challenge.id}</CardTitle>
          <Badge variant="outline">{MODE_LABEL_ES[challenge.mode]}</Badge>
          {completed && (
            <Badge className="gap-1 bg-scaffold-easy-bg text-scaffold-easy hover:bg-scaffold-easy-bg">
              <Trophy className="h-3 w-3" /> completado
            </Badge>
          )}
        </div>
        <p className="text-sm">{challenge.instructionsEs}</p>
        {challenge.mode === "oral" && (
          <p className="text-xs text-muted-foreground">
            Se practica en voz alta. Anota abajo cómo fue (cuántas tomas, qué costó).
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="font-code text-[11px] uppercase tracking-wide text-muted-foreground">
            Rúbrica · márcala cuando tu entrega la cumpla
          </p>
          <ul className="space-y-2">
            {challenge.criteria.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Checkbox
                  id={`crit-${challenge.id}-${i}`}
                  checked={checked.includes(i)}
                  onCheckedChange={(v) => toggleCriterion(i, v === true)}
                />
                <label htmlFor={`crit-${challenge.id}-${i}`} className="leading-snug">
                  {c}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {previous && (
          <p className="text-xs text-muted-foreground">
            Entrega anterior cargada ({new Date(previous.submittedAt).toLocaleDateString("es")}). Puedes mejorarla.
          </p>
        )}

        <div className="space-y-1">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tu entrega en inglés, o tus notas de práctica…"
            rows={7}
            aria-label="Tu entrega"
          />
          <p className="text-right font-code text-[11px] text-muted-foreground">{readiness.words} palabras</p>
        </div>

        {review === "failed" && (
          <p className="text-xs text-muted-foreground">
            Emma no pudo revisar esta vez. Puedes entregar igual con tu autoevaluación.
          </p>
        )}
        {review && review !== "failed" && <EmmaReview review={review} criteria={challenge.criteria} />}

        {!readiness.ready && text.trim().length > 0 && (
          <ul className="space-y-1 text-xs text-scaffold-mid">
            {readiness.missingEs.map((m) => (
              <li key={m}>· {m}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={askEmma}
            disabled={reviewing || readiness.words === 0}
            className="gap-1"
          >
            {reviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Pedir opinión a Emma
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !readiness.ready}>
            {completed ? "Guardar nueva entrega" : "Entregar y completar"}
          </Button>
          <Button variant="ghost" onClick={onExit}>
            Volver a la lista
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  runtime: EmmaRuntime;
  initialUnit?: number;
  /** Aviso de que cambió el progreso de retos (para refrescar el panel «Hoy»). */
  onChange?: () => void;
}

export function ChallengeView({ runtime, initialUnit, onChange }: Props) {
  const [unit, setUnit] = useState<number>(
    initialUnit !== undefined && AVAILABLE_UNITS.includes(initialUnit)
      ? initialUnit
      : AVAILABLE_UNITS[0] ?? 1,
  );
  const [selected, setSelected] = useState<UnitChallenge | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 72 });
  const repo = useMemo(() => createChallengeRepository(), []);

  const refresh = useMemo(
    () => async () => {
      const [ids, prog, subs] = await Promise.all([
        repo.loadCompleted(),
        getChallengeProgress({ repo }),
        repo.loadSubmissions(),
      ]);
      setCompleted(new Set(ids));
      setProgress(prog);
      setSubmissions(subs);
    },
    [repo],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const challenges = useMemo(() => challengesForUnit(unit), [unit]);
  const unitDone = challenges.filter((c) => completed.has(c.id)).length;

  if (selected) {
    return (
      <ChallengeDetail
        key={selected.id}
        challenge={selected}
        completed={completed.has(selected.id)}
        previous={submissions.find((s) => s.challengeId === selected.id) ?? null}
        runtime={runtime}
        onSubmitted={() => {
          void refresh();
          onChange?.();
          setSelected(null);
        }}
        onExit={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Retos del libro</span>
          <span className="font-code text-xs">
            {progress.done}/{progress.total}
          </span>
        </div>
        <Progress value={(progress.done / progress.total) * 100} className="h-1.5" />
      </div>

      <Select value={String(unit)} onValueChange={(v) => setUnit(Number(v))}>
        <SelectTrigger className="w-full sm:w-80">
          <SelectValue placeholder="Elige una unidad" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_UNITS.map((u) => (
            <SelectItem key={u} value={String(u)}>
              {unitLabel(u)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {challenges.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {unitDone === challenges.length
            ? "Unidad completa. Puedes rehacer cualquier reto para mejorarlo."
            : `${unitDone} de ${challenges.length} retos de esta unidad completados.`}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {challenges.map((challenge) => {
          const done = completed.has(challenge.id);
          return (
            <button
              key={challenge.id}
              type="button"
              onClick={() => setSelected(challenge)}
              className={`rounded-bubble border p-4 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                done ? "border-scaffold-easy/40 bg-scaffold-easy-bg/50" : "border-border bg-card"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="font-headline text-sm font-semibold">Reto {challenge.id}</span>
                <Badge variant="outline" className="text-[10px]">
                  {MODE_LABEL_ES[challenge.mode]}
                </Badge>
                {done && <Check className="ml-auto h-4 w-4 text-scaffold-easy" />}
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{challenge.instructionsEs}</p>
            </button>
          );
        })}
        {challenges.length === 0 && (
          <p className="text-sm text-muted-foreground">Esta unidad no tiene retos.</p>
        )}
      </div>
    </div>
  );
}
