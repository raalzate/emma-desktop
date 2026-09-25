"use client";

/**
 * Mis lecciones: lo que EMMA anotó al cerrar cada sesión, para hacerlo cuando
 * el aprendiz quiera. No hay «nueva lección» — la lista es el registro de lo
 * que EMMA recomendó, no una libreta libre (#172).
 *
 * Andamiaje en español; el contenido de la lección (frases, retos) sigue en
 * inglés tal como lo escribió EMMA (Artículo 9).
 */

import Link from "next/link";
import { Check, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLessonTodos } from "./use-lesson-todos";
import type { LessonTodo } from "@/domain/lessons/lesson-todo";

/** Fecha corta en español; el store guarda milisegundos. */
function formatDay(at: number): string {
  return new Date(at).toLocaleDateString("es", { day: "2-digit", month: "short" });
}

function TodoRow({
  todo,
  onComplete,
  onDismiss,
}: {
  todo: LessonTodo;
  onComplete: () => void;
  onDismiss: () => void;
}) {
  return (
    <li className="rounded-lg border p-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-medium">{todo.titleEs}</span>
        <Badge variant="secondary" className="shrink-0">
          {todo.origin.scenarioTitle}
          {todo.origin.situationTitle ? ` · ${todo.origin.situationTitle}` : ""}
        </Badge>
        <span className="text-xs text-muted-foreground">
          anotada el {formatDay(todo.createdAt)}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{todo.reasonEs}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button asChild size="sm" className="gap-1">
          <Link href={todo.href}>
            <Play className="h-3.5 w-3.5" /> Empezar
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="gap-1" onClick={onComplete}>
          <Check className="h-3.5 w-3.5" /> Ya la hice
        </Button>
        <Button size="sm" variant="ghost" className="gap-1" onClick={onDismiss}>
          <X className="h-3.5 w-3.5" /> Descartar
        </Button>
      </div>
    </li>
  );
}

export function LessonTodoList() {
  const { pending, todos, loading, complete, dismiss } = useLessonTodos();
  const closed = todos.filter((t) => t.status !== "pending");

  if (loading) return null;

  return (
    <div className="space-y-4">
      {pending.length === 0 ? (
        <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          No tienes lecciones pendientes. Al terminar una conversación, EMMA anota aquí lo que
          te conviene practicar.
        </p>
      ) : (
        <ul className="space-y-2">
          {pending.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onComplete={() => void complete(todo.id)}
              onDismiss={() => void dismiss(todo.id)}
            />
          ))}
        </ul>
      )}
      {closed.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cerradas
          </p>
          <ul className="mt-2 space-y-1">
            {closed.map((todo) => (
              <li key={todo.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className={todo.status === "done" ? "" : "text-muted-foreground"}>
                  {todo.status === "done" ? "✅" : "🚫"} {todo.titleEs}
                </span>
                <span className="text-xs text-muted-foreground">
                  {todo.status === "done" ? "hecha" : "descartada"}
                  {todo.closedAt ? ` el ${formatDay(todo.closedAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
