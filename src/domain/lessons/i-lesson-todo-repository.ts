/**
 * Puerto de persistencia de la lista de lecciones. El dominio sólo conoce esta
 * interfaz; el adaptador concreto (store JSON vía IPC) se inyecta desde afuera.
 */

import type { LessonTodo } from "./lesson-todo";

export interface ILessonTodoRepository {
  loadAll(): Promise<LessonTodo[]>;
  saveAll(list: LessonTodo[]): Promise<void>;
}
