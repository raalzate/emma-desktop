/**
 * #172 — casos de uso de la lista de lecciones con un repositorio falso: lo que
 * importa aquí es que se guarde lo justo y que la decisión siga siendo del
 * dominio.
 */

import { describe, it, expect, vi } from "vitest";
import {
  addLessonTodoUseCase,
  completeLessonTodoUseCase,
  dismissLessonTodoUseCase,
} from "../lesson-todo-use-cases";
import type { ILessonTodoRepository } from "@/domain/lessons/i-lesson-todo-repository";
import type { LessonTodo, LessonTodoDraft } from "@/domain/lessons/lesson-todo";

const draft: LessonTodoDraft = {
  kind: "srs-review",
  target: "due",
  titleEs: "Repaso pendiente",
  reasonEs: "Tenés 7 tarjetas esperando",
  href: "/practice?tab=srs",
  origin: { sessionAt: 10, scenarioType: "daily_standup", scenarioTitle: "Daily Standup" },
};

function fakeRepo(initial: LessonTodo[] = []) {
  let list = initial;
  return {
    saved: vi.fn(),
    repo: {
      async loadAll() {
        return list;
      },
      async saveAll(next) {
        list = next;
      },
    } satisfies ILessonTodoRepository,
    get list() {
      return list;
    },
  };
}

describe("addLessonTodoUseCase", () => {
  it("persiste la lección anotada", async () => {
    const f = fakeRepo();
    const next = await addLessonTodoUseCase({ repo: f.repo, draft, now: 100 });
    expect(next).toHaveLength(1);
    expect(f.list).toHaveLength(1);
    expect(f.list[0].status).toBe("pending");
  });

  it("no escribe cuando la lección ya estaba anotada", async () => {
    const f = fakeRepo();
    await addLessonTodoUseCase({ repo: f.repo, draft, now: 100 });
    const spy = vi.spyOn(f.repo, "saveAll");
    const next = await addLessonTodoUseCase({ repo: f.repo, draft, now: 200 });
    expect(next).toHaveLength(1);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("cerrar una lección", () => {
  it("completar la marca como hecha con su fecha", async () => {
    const f = fakeRepo();
    const [todo] = await addLessonTodoUseCase({ repo: f.repo, draft, now: 100 });
    await completeLessonTodoUseCase({ repo: f.repo, id: todo.id, now: 500 });
    expect(f.list[0].status).toBe("done");
    expect(f.list[0].closedAt).toBe(500);
  });

  it("descartar la saca de pendientes sin haberla hecho", async () => {
    const f = fakeRepo();
    const [todo] = await addLessonTodoUseCase({ repo: f.repo, draft, now: 100 });
    await dismissLessonTodoUseCase({ repo: f.repo, id: todo.id, now: 500 });
    expect(f.list[0].status).toBe("dismissed");
  });
});
