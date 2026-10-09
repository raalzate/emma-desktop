"use client";

/**
 * Estado de la lista de lecciones en el renderer: carga desde el store y
 * delega cada cambio en su caso de uso.
 *
 * La lista se ve en dos sitios a la vez (el contador de la navegación y la
 * pestaña de /practice), así que cada cambio emite un evento de ventana y todas
 * las instancias recargan — sin store global ni polling.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addLessonTodoUseCase,
  completeLessonTodoUseCase,
  completeLessonTodosByKindUseCase,
  dismissLessonTodoUseCase,
} from "@/application/lessons/lesson-todo-use-cases";
import type { LessonTodoKind } from "@/domain/lessons/lesson-todo";
import { createLessonTodoRepository } from "@/infrastructure/persistence/lesson-todo-repository";
import {
  newlyDoneCount,
  pendingLessonTodos,
  type LessonTodo,
  type LessonTodoDraft,
} from "@/domain/lessons/lesson-todo";
import { awardActivities } from "@/components/gamification/award-activity";

export const LESSON_TODOS_CHANGED = "emma:lesson-todos-changed";

function announce(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(LESSON_TODOS_CHANGED));
}

export function useLessonTodos() {
  const repo = useMemo(() => createLessonTodoRepository(), []);
  const [todos, setTodos] = useState<LessonTodo[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const list = await repo.loadAll().catch(() => []);
    setTodos(list);
    setLoading(false);
  }, [repo]);

  useEffect(() => {
    void reload();
    if (typeof window === "undefined") return;
    const onChange = () => void reload();
    window.addEventListener(LESSON_TODOS_CHANGED, onChange);
    return () => window.removeEventListener(LESSON_TODOS_CHANGED, onChange);
  }, [reload]);

  const apply = useCallback(
    async (run: () => Promise<LessonTodo[]>) => {
      const before = await repo.loadAll().catch(() => []);
      const next = await run();
      setTodos(next);
      announce();
      // Cada lección que se cierra hecha (a mano o sola) suma XP (#216).
      const done = newlyDoneCount(before, next);
      if (done > 0) void awardActivities(Array.from({ length: done }, () => ({ kind: "lesson" as const })));
      return next;
    },
    [repo],
  );

  return {
    todos,
    pending: pendingLessonTodos(todos),
    loading,
    add: (draft: LessonTodoDraft) => apply(() => addLessonTodoUseCase({ repo, draft })),
    complete: (id: string) => apply(() => completeLessonTodoUseCase({ repo, id })),
    /** La actividad se hizo: la lección se cierra sola (repaso terminado, reto entregado). */
    completeByKind: (kind: LessonTodoKind, target?: string) =>
      apply(() => completeLessonTodosByKindUseCase({ repo, kind, target })),
    dismiss: (id: string) => apply(() => dismissLessonTodoUseCase({ repo, id })),
  };
}
