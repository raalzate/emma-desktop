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
  dismissLessonTodoUseCase,
} from "@/application/lessons/lesson-todo-use-cases";
import { createLessonTodoRepository } from "@/infrastructure/persistence/lesson-todo-repository";
import { pendingLessonTodos, type LessonTodo, type LessonTodoDraft } from "@/domain/lessons/lesson-todo";

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
      const next = await run();
      setTodos(next);
      announce();
      return next;
    },
    [],
  );

  return {
    todos,
    pending: pendingLessonTodos(todos),
    loading,
    add: (draft: LessonTodoDraft) => apply(() => addLessonTodoUseCase({ repo, draft })),
    complete: (id: string) => apply(() => completeLessonTodoUseCase({ repo, id })),
    dismiss: (id: string) => apply(() => dismissLessonTodoUseCase({ repo, id })),
  };
}
