/**
 * Casos de uso de la lista de lecciones: anotar desde el feedback, completar y
 * descartar. Orquestan el dominio con el repositorio inyectado por argumento;
 * la decisión (dedupe, transición) vive en `domain/lessons/lesson-todo.ts`.
 */

import type { ILessonTodoRepository } from "@/domain/lessons/i-lesson-todo-repository";
import {
  addLessonTodo,
  completeLessonTodo,
  dismissLessonTodo,
  type LessonTodo,
  type LessonTodoDraft,
} from "@/domain/lessons/lesson-todo";

interface RepoArgs {
  repo: ILessonTodoRepository;
  /** Reloj inyectado: el dominio no lee la hora del sistema. */
  now?: number;
}

/** Anota la recomendación del cierre. Devuelve la lista resultante. */
export async function addLessonTodoUseCase(
  args: RepoArgs & { draft: LessonTodoDraft },
): Promise<LessonTodo[]> {
  const list = await args.repo.loadAll();
  const next = addLessonTodo(list, args.draft, args.now ?? Date.now());
  if (next.length !== list.length) await args.repo.saveAll(next);
  return next;
}

export async function completeLessonTodoUseCase(
  args: RepoArgs & { id: string },
): Promise<LessonTodo[]> {
  const next = completeLessonTodo(await args.repo.loadAll(), args.id, args.now ?? Date.now());
  await args.repo.saveAll(next);
  return next;
}

export async function dismissLessonTodoUseCase(
  args: RepoArgs & { id: string },
): Promise<LessonTodo[]> {
  const next = dismissLessonTodo(await args.repo.loadAll(), args.id, args.now ?? Date.now());
  await args.repo.saveAll(next);
  return next;
}
