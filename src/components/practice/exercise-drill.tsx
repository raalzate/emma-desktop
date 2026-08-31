"use client";

/**
 * Ejercicios cerrados del paso Practice: selector de unidad → lista de
 * ejercicios → corrección ítem a ítem con evaluateItem/gradeExercise
 * (dominio puro, sin LLM). UI en español; el contenido del ejercicio (stem,
 * respuestas) es el texto en inglés del libro fuente.
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { evaluateItem, gradeExercise } from "@/domain/exercises/evaluate-exercise";
import type { UnitExercise } from "@/domain/exercises/exercise";
import { EXERCISES_P1_U13 } from "@/lib/exercise-data/exercises-part1-u13";
import { EXERCISES_U14_26 } from "@/lib/exercise-data/exercises-u14-26";
import { ALL_UNITS } from "@/lib/curriculum-data";

const ALL_EXERCISES: UnitExercise[] = [...EXERCISES_P1_U13, ...EXERCISES_U14_26];

/** Título del selector para una unidad (0 = Parte 1, sin número de libro). */
function unitLabel(unit: number): string {
  if (unit === 0) return "Parte 1 · Sonidos";
  const found = ALL_UNITS.find((u) => u.number === unit);
  return found ? `Unidad ${unit} · ${found.title}` : `Unidad ${unit}`;
}

const AVAILABLE_UNITS = Array.from(new Set(ALL_EXERCISES.map((e) => e.unit))).sort((a, b) => a - b);

/** Corrección de un ítem ya respondido; null mientras no se ha enviado. */
interface ItemFeedback {
  correct: boolean;
  expected: string;
}

function ExerciseRunner({ exercise, onExit }: { exercise: UnitExercise; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<ItemFeedback | null>(null);
  const [finished, setFinished] = useState(false);

  const item = exercise.items[index];

  function submitAnswer() {
    if (feedback) return; // ya corregido; solo falta avanzar
    const result = evaluateItem(item, draft);
    setFeedback(result);
  }

  function goNext() {
    const nextAnswers = [...answers, draft];
    setAnswers(nextAnswers);
    setFeedback(null);
    setDraft("");
    if (index + 1 < exercise.items.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
    }
  }

  if (finished) {
    const summary = gradeExercise(exercise, answers);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumen del ejercicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Aciertos: <span className="font-semibold">{summary.correct}</span> de {summary.total}
          </p>
          <Button onClick={onExit}>Volver a la lista</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{exercise.promptEs}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Ítem {index + 1} de {exercise.items.length}
        </p>
        <p className="font-medium">{item.stem}</p>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!!feedback}
          placeholder="Tu respuesta en inglés"
        />
        {feedback ? (
          <div className="space-y-1 text-sm">
            <p className={feedback.correct ? "text-green-600" : "text-red-600"}>
              {feedback.correct ? "✅ Correcto" : "❌ Incorrecto"}
            </p>
            {!feedback.correct && (
              <p className="text-muted-foreground">Respuesta esperada: {feedback.expected}</p>
            )}
            {item.noteEs && <p className="text-muted-foreground">{item.noteEs}</p>}
          </div>
        ) : null}
        <div className="flex gap-2">
          {!feedback ? (
            <Button onClick={submitAnswer}>Corregir</Button>
          ) : (
            <Button onClick={goNext}>
              {index + 1 < exercise.items.length ? "Siguiente" : "Ver resumen"}
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
  /** Preselección desde una recomendación de Emma (deep-link ?unit=&exercise=). */
  initialUnit?: number;
  initialExerciseId?: string;
}

export function ExerciseDrill({ initialUnit, initialExerciseId }: Props = {}) {
  const [unit, setUnit] = useState<number>(
    initialUnit !== undefined && AVAILABLE_UNITS.includes(initialUnit)
      ? initialUnit
      : AVAILABLE_UNITS[0] ?? 0,
  );
  const [selected, setSelected] = useState<UnitExercise | null>(
    (initialExerciseId && ALL_EXERCISES.find((e) => e.id === initialExerciseId)) || null,
  );

  const exercisesOfUnit = useMemo(
    () => ALL_EXERCISES.filter((e) => e.unit === unit),
    [unit],
  );

  if (selected) {
    return <ExerciseRunner exercise={selected} onExit={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-4">
      <Select
        value={String(unit)}
        onValueChange={(v) => setUnit(Number(v))}
      >
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
          <Card
            key={exercise.id}
            className="cursor-pointer transition hover:border-primary"
            onClick={() => setSelected(exercise)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-sm">
                {exercise.id} · {exercise.promptEs}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
        {exercisesOfUnit.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay ejercicios para esta unidad todavía.</p>
        )}
      </div>
    </div>
  );
}
