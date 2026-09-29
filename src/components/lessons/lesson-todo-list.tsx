"use client";

/**
 * Mis lecciones: lo que EMMA anotó al cerrar cada sesión, para hacerlo cuando
 * el aprendiz quiera. No hay «nueva lección» — la lista es el registro de lo
 * que EMMA recomendó, no una libreta libre (#172).
 *
 * FR-007 (#198): sin «Dismiss» — descartar saltaría la práctica que desbloquea
 * la siguiente escena de la ruta (FR-006). Sólo se puede cerrar practicando
 * («Done»); el dominio conserva `dismissLessonTodo` por si otro flujo lo usa.
 *
 * UI en inglés (Artículo 9); el contenido de la lección (frases, retos) es el
 * que escribió EMMA.
 */

import Link from "next/link";
import { Check, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLessonTodos } from "./use-lesson-todos";
import { lessonTodoReason, lessonTodoTitle } from "@/domain/lessons/lesson-todo-copy";
import type { LessonTodo } from "@/domain/lessons/lesson-todo";

/** Fecha corta en inglés («Sep 25»); el store guarda milisegundos. */
function formatDay(at: number): string {
  return new Date(at).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function TodoRow({
  todo,
  onComplete,
}: {
  todo: LessonTodo;
  onComplete: () => void;
}) {
  return (
    <li className="flex flex-col rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-medium">{lessonTodoTitle(todo)}</span>
        <Badge variant="secondary" className="shrink-0">
          {todo.origin.scenarioTitle}
          {todo.origin.situationTitle ? ` · ${todo.origin.situationTitle}` : ""}
        </Badge>
        <span className="text-xs text-muted-foreground">
          noted on {formatDay(todo.createdAt)}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{lessonTodoReason(todo)}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <Button asChild size="sm" className="gap-1" title="Abre la práctica que Emma te dejó">
          <Link href={todo.href}>
            <Play className="h-3.5 w-3.5" /> Start
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="gap-1" title="Marca la lección como practicada y la quita de la lista" onClick={onComplete}>
          <Check className="h-3.5 w-3.5" /> Done
        </Button>
      </div>
    </li>
  );
}

export function LessonTodoList() {
  const { pending, todos, loading, complete } = useLessonTodos();
  const closed = todos.filter((t) => t.status !== "pending");

  if (loading) return null;

  return (
    <div className="space-y-4">
      {pending.length === 0 ? (
        <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          No pending lessons. When a conversation ends, EMMA notes here what you should
          practice next.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {pending.map((todo) => (
            <TodoRow key={todo.id} todo={todo} onComplete={() => void complete(todo.id)} />
          ))}
        </ul>
      )}
      {closed.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Closed
          </p>
          <ul className="mt-2 space-y-1">
            {closed.map((todo) => (
              <li key={todo.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className={todo.status === "done" ? "" : "text-muted-foreground"}>
                  {todo.status === "done" ? "✅" : "🚫"} {lessonTodoTitle(todo)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {todo.status === "done" ? "done" : "dismissed"}
                  {todo.closedAt ? ` on ${formatDay(todo.closedAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
