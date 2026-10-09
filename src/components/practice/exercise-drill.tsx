"use client";

/**
 * Ejercicios cerrados del paso Practice: selector de unidad → lista →
 * sesión ítem a ítem. La pedagogía vive en el dominio (`drill-session`):
 * diagnóstico correcto/casi/mal, reintento ante un "casi", pistas graduales,
 * racha y resumen con repetición de fallados y envío al Repaso (SRS). Cuándo
 * un ítem se responde tocando una opción o escribiendo lo decide
 * `drill-options`. El componente sólo pinta el estado y despacha acciones.
 * UI en inglés; el contenido del ejercicio (stem, respuestas) es el inglés
 * del libro fuente.
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Flame, Lightbulb, RotateCcw, BookmarkPlus, Check, X, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnswerFeedback, ItemTransition, Stagger, StaggerItem } from "@/components/motion";
import { awardActivities } from "@/components/gamification/award-activity";
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
import { SpeakButton } from "@/components/chat/speak-button";
import type { UnitExercise } from "@/domain/exercises/exercise";
import { hintFor, type AnswerDiagnosis } from "@/domain/exercises/answer-diagnosis";
import { optionsFor, describeInteraction } from "@/domain/exercises/drill-options";
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
import { explainExerciseItem } from "@/application/exercises/explain-exercise-item-use-case";
import type { ItemExplanation } from "@/domain/exercises/item-explanation";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { todayAsDays } from "@/interface/today";
import { EXERCISES_P1_U13 } from "@/lib/exercise-data/exercises-part1-u13";
import { EXERCISES_U14_26 } from "@/lib/exercise-data/exercises-u14-26";
import { ALL_UNITS } from "@/lib/curriculum-data";

const ALL_EXERCISES: UnitExercise[] = [...EXERCISES_P1_U13, ...EXERCISES_U14_26];

const KIND_LABEL_ES: Record<UnitExercise["kind"], string> = {
  fill: "Fill in",
  transform: "Transform",
  correct: "Correct",
  translate: "Translate",
  order: "Order",
  classify: "Classify",
  choose: "Choose",
};

/** Unidad 0 = Parte 1 del libro: el sistema de sonidos (se puede escuchar cada ítem). */
const SOUNDS_UNIT = 0;

/** Título del selector para una unidad (0 = Parte 1, sin número de libro). */
function unitLabel(unit: number): string {
  if (unit === SOUNDS_UNIT) return "English sounds · pronunciation";
  const found = ALL_UNITS.find((u) => u.number === unit);
  return found ? `Unit ${unit} · ${found.title}` : `Unit ${unit}`;
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

/**
 * «Explain with Emma»: análisis enriquecido del ítem bajo demanda (palabra,
 * IPA, traducción, porqué, ejemplo). Es el puente al español del Artículo 9:
 * se pide con un botón y llega como contenido de Emma, no como copy de la UI.
 */
function ExplainWithEmma({ state, runtime }: { state: DrillState; runtime: EmmaRuntime }) {
  const item = state.exercise.items[state.index];
  // Lo que el aprendiz contestó: los huecos del diagnóstico, en orden.
  const given = (state.lastDiagnosis?.slots ?? []).map((s) => s.given).join(" ");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [explanation, setExplanation] = useState<ItemExplanation | null>(null);

  // Cada ítem nuevo empieza sin explicación.
  useEffect(() => {
    setStatus("idle");
    setExplanation(null);
  }, [state.index, state.exercise.id]);

  async function explain() {
    setStatus("loading");
    const result = await explainExerciseItem({ llm: runtime.llm, exercise: state.exercise, item, given });
    setExplanation(result);
    setStatus(result ? "done" : "error");
  }

  if (status === "idle" || status === "loading") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-1"
        title="Emma explica la palabra: cómo suena, qué significa, por qué esta respuesta y un ejemplo"
        onClick={() => void explain()}
        disabled={status === "loading"}
      >
        {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {status === "loading" ? "Emma is thinking…" : "Explain with Emma"}
      </Button>
    );
  }
  if (status === "error" || !explanation) {
    return <p className="text-xs text-muted-foreground">Emma couldn't explain this time.</p>;
  }
  return (
    <div className="space-y-2 rounded-md border border-border bg-card p-3 text-foreground">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-headline text-lg font-semibold">{explanation.word}</span>
        {explanation.ipa && <span className="font-code text-sm text-muted-foreground">{explanation.ipa}</span>}
        <SpeakButton text={explanation.word} />
      </div>
      <p>
        <span className="font-code text-[11px] uppercase tracking-wide text-muted-foreground">ES · </span>
        {explanation.translationEs}
      </p>
      <p>
        <span className="font-code text-[11px] uppercase tracking-wide text-muted-foreground">Why · </span>
        {explanation.whyEs}
      </p>
      {explanation.exampleEn && (
        <p className="rounded-md bg-primary-soft p-2">
          <span className="italic">{explanation.exampleEn}</span>
          {explanation.exampleEs && <span className="block text-sm text-muted-foreground">{explanation.exampleEs}</span>}
        </p>
      )}
    </div>
  );
}

function FeedbackPanel({ state, runtime }: { state: DrillState; runtime: EmmaRuntime }) {
  const diagnosis = state.lastDiagnosis;
  if (!diagnosis) return null;
  const item = state.exercise.items[state.index];
  const last = state.results[state.results.length - 1];
  const closedCorrect = state.phase === "reviewing" && last?.verdict === "correct";

  if (state.phase === "retrying") {
    return (
      <AnswerFeedback state="error" className="space-y-2 rounded-bubble border border-scaffold-mid/40 bg-scaffold-mid-bg p-3 text-sm">
        <p className="font-medium text-scaffold-mid">Almost. One detail to fix.</p>
        <SlotVerdicts diagnosis={diagnosis} reveal={false} />
        <p className="text-muted-foreground">
          Check the form and try again: you get a second try before seeing the answer.
        </p>
      </AnswerFeedback>
    );
  }

  return (
    <AnswerFeedback
      state={closedCorrect ? "success" : "error"}
      className={`space-y-2 rounded-bubble border p-3 text-sm ${
        closedCorrect
          ? "border-scaffold-easy/40 bg-scaffold-easy-bg"
          : "border-scaffold-hard/40 bg-scaffold-hard-bg"
      }`}
    >
      <p className={`font-medium ${closedCorrect ? "text-scaffold-easy" : "text-scaffold-hard"}`}>
        {closedCorrect
          ? last.attempts > 1
            ? "Correct on the second try. That counts too."
            : "Correct."
          : "Not that one."}
      </p>
      <SlotVerdicts diagnosis={diagnosis} reveal />
      {!closedCorrect && (
        <p>
          Correct answer: <span className="font-code">{diagnosis.expected}</span>
        </p>
      )}
      {item.noteEs && <p className="text-muted-foreground">{item.noteEs}</p>}
      <ExplainWithEmma state={state} runtime={runtime} />
    </AnswerFeedback>
  );
}

/** Botonera de opciones cerradas: al tocar una se corrige de inmediato. */
function OptionButtons({
  options,
  chosen,
  expected,
  disabled,
  onChoose,
}: {
  options: string[];
  chosen: string | null;
  expected: string | null;
  disabled: boolean;
  onChoose: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Options">
      {options.map((option) => {
        const isChosen = chosen === option;
        const isExpected = expected !== null && option.toLowerCase() === expected.toLowerCase();
        const tone =
          expected === null
            ? ""
            : isExpected
              ? "border-scaffold-easy bg-scaffold-easy-bg text-scaffold-easy"
              : isChosen
                ? "border-scaffold-hard bg-scaffold-hard-bg text-scaffold-hard"
                : "opacity-60";
        return (
          <Button
            key={option}
            type="button"
            variant="outline"
            title="Elige esta opción como respuesta"
            disabled={disabled}
            onClick={() => onChoose(option)}
            className={`h-auto min-h-10 whitespace-normal py-2 text-left font-body text-sm ${tone}`}
          >
            {option}
          </Button>
        );
      })}
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
          {summary.masteryPct === 100 ? "Exercise mastered" : "Exercise summary"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-headline text-4xl font-semibold text-primary">{summary.masteryPct}%</span>
          <div className="text-sm text-muted-foreground">
            <p>
              {summary.correct} of {summary.total} correct
              {state.round > 1 && ` · round ${state.round}`}
            </p>
            {summary.bestStreak >= 2 && (
              <p className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-accent" /> Best streak: {summary.bestStreak}
              </p>
            )}
          </div>
        </div>
        <Progress value={summary.masteryPct} className="h-2" />
        <p className="text-sm">{summary.messageEs}</p>

        {failedItems.length > 0 && (
          <div className="space-y-2">
            <p className="font-code text-[11px] uppercase tracking-wide text-muted-foreground">
              To review
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
              <Button title="Repite solo los ítems que fallaste" onClick={onRepeatFailed} className="gap-1">
                <RotateCcw className="h-4 w-4" /> Repeat the missed ones
              </Button>
              <Button variant="outline" title="Convierte los ítems fallados en tarjetas de repaso espaciado" onClick={saveToSrs} disabled={saving || saved !== null} className="gap-1">
                <BookmarkPlus className="h-4 w-4" />
                {saved === null
                  ? "Save to Review"
                  : saved === 0
                    ? "Already in Review"
                    : `${saved} card(s) added`}
              </Button>
            </>
          )}
          <Button variant="ghost" title="Vuelve a la lista de ejercicios" onClick={onExit}>
            Back to the list
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExerciseRunner({ exercise, runtime, onExit, onChange }: RunnerProps) {
  const [state, setState] = useState<DrillState>(() => startDrill(exercise));
  const [draft, setDraft] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const item = state.exercise.items[state.index];
  const answering = state.phase === "answering";
  const total = state.exercise.items.length;
  const progressPct = (state.results.length / total) * 100;
  const options = useMemo(() => optionsFor(state.exercise, state.index), [state.exercise, state.index]);
  const optionMode = options !== null;
  const canListen = state.exercise.unit === SOUNDS_UNIT && !/\s/.test(item.stem.trim());

  useEffect(() => {
    if (answering && !optionMode) inputRef.current?.focus();
  }, [answering, optionMode, state.index]);

  // Cada ítem cerrado suma XP (#216). Repetir los fallados reinicia los resultados.
  const awardedResults = useRef(0);
  useEffect(() => {
    const fresh = state.results.slice(awardedResults.current);
    awardedResults.current = state.results.length;
    if (fresh.length === 0) return;
    void awardActivities(fresh.map((r) => ({ kind: "exercise", correct: r.verdict === "correct" })));
  }, [state.results]);

  function submit() {
    setState((s) => submitDraft(s, draft));
  }

  function choose(option: string) {
    setChosen(option);
    setState((s) => submitDraft(s, option));
  }

  function next() {
    setDraft("");
    setChosen(null);
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
          setChosen(null);
          setState(restartWithFailed);
        }}
      />
    );
  }

  const revealedExpected = state.phase === "reviewing" ? (state.lastDiagnosis?.expected ?? null) : null;

  return (
    <ItemTransition itemKey={state.index}>
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
              Item {state.index + 1} of {total}
            </span>
          </div>
        </div>
        <Progress value={progressPct} className="h-1.5" />
        <CardTitle className="text-base font-medium">{state.exercise.promptEs}</CardTitle>
        <p className="text-xs text-muted-foreground">{describeInteraction(state.exercise, state.index)}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="font-headline text-lg leading-snug">{item.stem}</p>
          {canListen && <SpeakButton key={item.stem} text={item.stem} label="Listen" />}
        </div>

        {!optionMode && state.hintLevel > 0 && (
          <p className="flex items-center gap-2 text-sm text-scaffold-mid">
            <Lightbulb className="h-4 w-4" />
            <span className="font-code tracking-wider">{hintFor(item.answer, state.hintLevel)}</span>
          </p>
        )}

        {optionMode ? (
          <OptionButtons
            options={options}
            chosen={chosen}
            expected={revealedExpected}
            disabled={!answering}
            onChoose={choose}
          />
        ) : (
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!answering}
            placeholder="Your answer in English · Enter to check"
            aria-label="Your answer"
            autoComplete="off"
          />
        )}

        <FeedbackPanel state={state} runtime={runtime} />

        <div className="flex flex-wrap gap-2">
          {state.phase === "answering" && !optionMode && (
            <>
              <Button title="Comprueba tu respuesta" onClick={submit} disabled={!draft.trim()}>
                Check
              </Button>
              <Button
                variant="outline"
                title="Muestra una pista sin revelar la respuesta"
                onClick={() => setState(revealHint)}
                disabled={state.hintLevel >= 2}
                className="gap-1"
              >
                <Lightbulb className="h-4 w-4" />
                {state.hintLevel === 0 ? "Hint" : "Another hint"}
              </Button>
            </>
          )}
          {state.phase === "retrying" && (
            <Button title="Intenta de nuevo con lo que aprendiste de la pista" onClick={retry} className="gap-1">
              <RotateCcw className="h-4 w-4" /> Try again
            </Button>
          )}
          {state.phase === "reviewing" && (
            <Button title={state.index + 1 < total ? "Pasa al siguiente ítem" : "Muestra el resumen de la sesión"} onClick={next} className="gap-1" autoFocus>
              {state.index + 1 < total ? "Next" : "See summary"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" title="Sale del ejercicio sin guardar el progreso" onClick={onExit}>
            Exit
          </Button>
        </div>
      </CardContent>
    </Card>
    </ItemTransition>
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
          <SelectValue placeholder="Pick a unit" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_UNITS.map((u) => (
            <SelectItem key={u} value={String(u)}>
              {unitLabel(u)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-xs text-muted-foreground">
        {exercisesOfUnit.length === 1
          ? "1 exercise in this unit. Tap one to start."
          : `${exercisesOfUnit.length} exercises in this unit. Tap one to start.`}
      </p>

      <Stagger className="grid gap-2 sm:grid-cols-2">
        {exercisesOfUnit.map((exercise) => (
          <StaggerItem key={exercise.id}>
          <button
            type="button"
            title="Abre este ejercicio"
            onClick={() => setSelected(exercise)}
            className="rounded-bubble border border-border bg-card p-4 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="font-code text-[11px] text-muted-foreground">{exercise.id}</span>
              <Badge variant="outline" className="text-[10px]">
                {KIND_LABEL_ES[exercise.kind]}
              </Badge>
              <span className="ml-auto text-[11px] text-muted-foreground">{exercise.items.length} items</span>
            </div>
            <p className="text-sm">{exercise.promptEs}</p>
          </button>
          </StaggerItem>
        ))}
        {exercisesOfUnit.length === 0 && (
          <p className="text-sm text-muted-foreground">No exercises for this unit yet.</p>
        )}
      </Stagger>
    </div>
  );
}
