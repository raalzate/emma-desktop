/**
 * Repositorio de la lista de lecciones sobre el almacén JSON (clave "lessonTodos").
 *
 * Mismo estilo que `challenge-repository.ts` / `srs-repository.ts`: guard clauses
 * al cargar (la guarda vive en el dominio, `isLessonTodo`) porque el origen es
 * disco local y un dato corrupto o de una versión anterior no debe romper la app.
 */

import type { ILessonTodoRepository } from "@/domain/lessons/i-lesson-todo-repository";
import { isLessonTodo, type LessonTodo } from "@/domain/lessons/lesson-todo";
import { readOne, writeOne } from "./store-client";

const KEY = "lessonTodos";

interface LessonTodosRecord {
  todos: LessonTodo[];
}

export function createLessonTodoRepository(): ILessonTodoRepository {
  return {
    async loadAll() {
      const stored = await readOne<LessonTodosRecord>(KEY);
      const todos = (stored as { todos?: unknown } | null)?.todos;
      return Array.isArray(todos) ? todos.filter(isLessonTodo) : [];
    },
    async saveAll(list) {
      await writeOne<LessonTodosRecord>(KEY, { todos: list });
    },
  };
}
