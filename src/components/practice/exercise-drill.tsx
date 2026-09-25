"use client";

/**
 * Ejercicios cerrados del paso Practice: selector de unidad → lista →
 * sesión ítem a ítem. La pedagogía vive en el dominio (`drill-session`):
 * diagnóstico correcto/casi/mal, reintento ante un "casi", pistas graduales,
 * racha y resumen con repetición de fallados y envío al Repaso (SRS). El
 * componente sólo pinta el estado y despacha acciones. UI en español; el
 * contenido del ejercicio (stem, respuestas) es el inglés del libro fuente.
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Flame, Lightbulb, RotateCcw, BookmarkPlus, Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UnitExercise } from "@/domain/exercises/exercise";
import { hintFor, type AnswerDiagnosis } from "@/domain/exercises/answer-diagnosis";
import {
  startDrill,
  submitDraft,
  retryItem,
  revealHint,
  nextItem,
  restartWithFailed,
  summarizeDrill,
  type DrillState,
} from "@/domain/exercises/drill-session";
import { captureExerciseMisses } from "@/application/srs/capture-exercise-misses-use-case";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { todayAsDays } from "@/interface/today";
import { EXERCISES_P1_U13 } from "@/lib/exercise-data/exercises-part1-u13";
import { EXERCISES_U14_26 } from "@/lib/exercise-data/exercises-u14-26";
import { ALL_UNITS } from "@/lib/curriculum-data";

const ALL_EXERCISES: UnitExercise[] = [...EXERCISES_P1_U13, ...EXERCISES_U14_26];

const KIND_LABEL_ES: Record<UnitExercise["kind"], string> = {
  fill: "Completar",
  transform: "Transformar",
  correct: "Corregir",
  translate: "Traducir",
  order: "Ordenar",
  classify: "Clasificar",
  choose: "Elegir",
};

/** Título del selector para una unidad (0 = Parte 1, sin número de libro). */
function unitLabel(unit: number): string {
  if (unit === 0) return "Parte 1 · Sonidos";
  const found = ALL_UNITS.find((u) => u.number === unit);
  return found ? `Unidad ${unit} · ${found.title}` : `Unidad ${unit}`;
}

const AVAILABLE_UNITS = Array.from(new Set(ALL_EXERCISES.map((e) => e.unit))).sort((a, b) => a - b);

/** Resalta cada hueco: verde si coincide, rojo con la forma esperada si no. */
function SlotVerdicts({ diagnosis, reveal }: { diagnosis: AnswerDiagnosis; reveal: boolean }) {
  if (diagnosis.slots.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-2 text-sm">
      {diagnosis.slots.map((slot, i) => (
        <li
          key={i}
          className={`rounded-md px-2 py-1 font-code text-xs ${
            slot.ok ? "bg-scaffold-easy-bg text-scaffold-easy" : "bg-scaffold-hard-bg text-scaffold-hard"
          }`}
        >
          {slot.ok ? <Check className="mr-1 inline h-3 w-3" /> : <X className="mr-1 inline h-3 w-3" />}
          {slot.given || "—"}
          {!slot.ok && reveal && <span className="ml-1 opacity-80">→ {slot.expected}</span>}
        </li>
      ))}
    </ul>
  );
}

function FeedbackPanel({ state }: { state: DrillState }) {
  const diagnosis = state.lastDiagnosis;
  if (!diagnosis) return null;
  const item = state.exercise.items[state.index];
  const last = state.results[state.results.length - 1];
  const closedCorrect = state.phase === "reviewing" && last?.verdict === "correct";

  if (state.phase === "retrying") {
    return (
      <div className="space-y-2 rounded-bubble border border-scaffold-mid/40 bg-scaffold-mid-bg p-3 text-sm">
        <p className="font-medium text-scaffold-mid">Casi. Hay un detalle por ajustar.</p>
        <SlotVerdicts diagnosis={diagnosis} reveal={false} />
        <p className="text-muted-foreground">
          Revisa la forma y vuelve a intentarlo: tienes un segundo intento antes de ver la clave.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`space-y-2 rounded-bubble border p-3 text-sm ${
        closedCorrect
          ? "border-scaffold-easy/40 bg-scaffold-easy-bg"
          : "border-scaffold-hard/40 bg-scaffold-hard-bg"
      }`}
    >
      <p className={`font-medium ${closedCorrect ? "text-scaffold-easy" : "text-scaffold-hard"}`}>
        {closedCorrect
          ? last.attempts > 1
            ? "Correcto al segundo intento. Eso también cuenta."
            : "Correcto."
          : "No era esa."}
      </p>
      <SlotVerdicts diagnosis={diagnosis} reveal />
      {!closedCorrect && (
        <p>
          Respuesta esperada: <span className="font-code">{diagnosis.expected}</span>
        </p>
      )}
      {item.noteEs && <p className="text-muted-foreground">{item.noteEs}</p>}
    </div>
  );
}

interface RunnerProps {
  exercise: UnitExercise;
  runtime: EmmaRuntime;
  onExit: () => void;
  onChange?: () => void;
}

function DrillSummary({ state, source, runtime, onExit, onRepeatFailed, onChange }: {
  state: DrillState;
  /** Ejercicio original (las rondas de repetición usan un subconjunto). */
  source: UnitExercise;
  runtime: EmmaRuntime;
  onExit: () => void;
  onRepeatFailed: () => void;
  onChange?: () => void;
}) {
  const summary = summarizeDrill(state);
  const [saved, setSaved] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  // failedIndexes ya viene en índices del ejercicio fuente.
  const failedItems = summary.failedIndexes.map((i) => source.items[i]);

  async function saveToSrs() {
    setSaving(true);
    try {
      const added = await captureExerciseMisses({
        repo: runtime.repos.srs,
        exercise: source,
        failedIndexes: summary.failedIndexes,
        today: todayAsDays(),
      });
      setSaved(added);
      onChange?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-bubble">
      <CardHeader>
        <CardTitle className="font-headline text-lg">
          {summary.masteryPct === 100 ? "Ejercicio dominado" : "Resumen del ejercicio"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-headline text-4xl font-semibold text-primary">{summary.masteryPct}%</span>
          <div className="text-sm text-muted-foreground">
            <p>
              {summary.correct} de {summary.total} aciertos
              {state.round > 1 && ` · ronda ${state.round}`}
            </p>
            {summary.bestStreak >= 2 && (
              <p className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-accent" /> Mejor racha: {summary.bestStreak}
              </p>
            )}
          </div>
        </div>
        <Progress value={summary.masteryPct} className="h-2" />
        <p className="text-sm">{summary.messageEs}</p>

        {failedItems.length > 0 && (
          <div className="space-y-2">
            <p className="font-code text-[11px] uppercase tracking-wide text-muted-foreground">
              Para repasar
            </p>
            <ul className="space-y-1 text-sm">
              {failedItems.map((item, i) => (
                <li key={i} className="rounded-md border border-border bg-secondary/40 p-2">
                  <p className="text-muted-foreground">{item.stem}</p>
                  <p className="font-code text-xs text-foreground">{item.answer}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {failedItems.length > 0 && (
            <>
              <Button onClick={onRepeatFailed} className="gap-1">
                <RotateCcw className="h-4 w-4" /> Repetir los fallados
              </Button>
              <Button variant="outline" onClick={saveToSrs} disabled={saving || saved !== null} className="gap-1">
                <BookmarkPlus className="h-4 w-4" />
                {saved === null
                  ? "Guardar en Repaso"
                  : saved === 0
                    ? "Ya estaban en Repaso"
                    : `${saved} tarjeta(s) añadidas`}
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={onExit}>
            Volver a la lista
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExerciseRunner({ exercise, runtime, onExit, onChange }: RunnerProps) {
  const [state, setState] = useState<DrillState>(() => startDrill(exercise));
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const item = state.exercise.items[state.index];
  const answering = state.phase === "answering";
  const total = state.exercise.items.length;
  const progressPct = (state.results.length / total) * 100;

  useEffect(() => {
    if (answering) inputRef.current?.focus();
  }, [answering, state.index]);

  function submit() {
    setState((s) => submitDraft(s, draft));
  }

  function next() {
    setDraft("");
    setState(nextItem);
  }

  function retry() {
    setState(retryItem);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (state.phase === "answering") submit();
    else if (state.phase === "retrying") retry();
    else if (state.phase === "reviewing") next();
  }

  if (state.phase === "finished") {
    return (
      <DrillSummary
        state={state}
        source={exercise}
        runtime={runtime}
        onExit={onExit}
        onChange={onChange}
        onRepeatFailed={() => {
          setDraft("");
          setState(restartWithFailed);
        }}
      />
    );
  }

  return (
    <Card className="rounded-bubble">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="font-code text-[11px]">
            {state.exercise.id} · {KIND_LABEL_ES[state.exercise.kind]}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {state.streak >= 2 && (
              <span className="flex items-center gap-1 text-accent">
                <Flame className="h-4 w-4" /> {state.streak}
              </span>
            )}
            <span>
              {state.index + 1} / {total}
            </span>
          </div>
        </div>
        <Progress value={progressPct} className="h-1.5" />
        <CardTitle className="text-base font-medium">{state.exercise.promptEs}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-headline text-lg leading-snug">{item.stem}</p>

        {state.hintLevel > 0 && (
          <p className="flex items-center gap-2 text-sm text-scaffold-mid">
            <Lightbulb className="h-4 w-4" />
            <span className="font-code tracking-wider">{hintFor(item.answer, state.hintLevel)}</span>
          </p>
        )}

        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={!answering}
          placeholder="Tu respuesta en inglés · Enter para corregir"
          aria-label="Tu respuesta"
          autoComplete="off"
        />

        <FeedbackPanel state={state} />

        <div className="flex flex-wrap gap-2">
          {state.phase === "answering" && (
            <>
              <Button onClick={submit} disabled={!draft.trim()}>
                Corregir
              </Button>
              <Button
                variant="outline"
                onClick={() => setState(revealHint)}
                disabled={state.hintLevel >= 2}
                className="gap-1"
              >
                <Lightbulb className="h-4 w-4" />
                {state.hintLevel === 0 ? "Pista" : "Otra pista"}
              </Button>
            </>
          )}
          {state.phase === "retrying" && (
            <Button onClick={retry} className="gap-1">
              <RotateCcw className="h-4 w-4" /> Volver a intentar
            </Button>
          )}
          {state.phase === "reviewing" && (
            <Button onClick={next} className="gap-1">
              {state.index + 1 < total ? "Siguiente" : "Ver resumen"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" onClick={onExit}>
            Salir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  runtime: EmmaRuntime;
  /** Preselección desde una recomendación de Emma (deep-link ?unit=&exercise=). */
  initialUnit?: number;
  initialExerciseId?: string;
  /** Aviso de que se guardaron tarjetas en Repaso (para refrescar el panel «Hoy»). */
  onChange?: () => void;
}

export function ExerciseDrill({ runtime, initialUnit, initialExerciseId, onChange }: Props) {
  const [unit, setUnit] = useState<number>(
    initialUnit !== undefined && AVAILABLE_UNITS.includes(initialUnit)
      ? initialUnit
      : AVAILABLE_UNITS[0] ?? 0,
  );
  const [selected, setSelected] = useState<UnitExercise | null>(
    (initialExerciseId && ALL_EXERCISES.find((e) => e.id === initialExerciseId)) || null,
  );

  const exercisesOfUnit = useMemo(() => ALL_EXERCISES.filter((e) => e.unit === unit), [unit]);

  if (selected) {
    return (
      <ExerciseRunner
        key={selected.id}
        exercise={selected}
        runtime={runtime}
        onExit={() => setSelected(null)}
        onChange={onChange}
      />
    );
  }

  return (
    <div className="space-y-4">
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

      <div className="grid gap-2 sm:grid-cols-2">
        {exercisesOfUnit.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            onClick={() => setSelected(exercise)}
            className="rounded-bubble border border-border bg-card p-4 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="font-code text-[11px] text-muted-foreground">{exercise.id}</span>
              <Badge variant="outline" className="text-[10px]">
                {KIND_LABEL_ES[exercise.kind]}
              </Badge>
              <span className="ml-auto text-[11px] text-muted-foreground">{exercise.items.length} ítems</span>
            </div>
            <p className="text-sm">{exercise.promptEs}</p>
          </button>
        ))}
        {exercisesOfUnit.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay ejercicios para esta unidad todavía.</p>
        )}
      </div>
    </div>
  );
}
