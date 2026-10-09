/**
 * #172 — casos de uso de la lista de lecciones con un repositorio falso: lo que
 * importa aquí es que se guarde lo justo y que la decisión siga siendo del
 * dominio.
 */

import { describe, it, expect, vi } from "vitest";
import {
  assignSessionLessons,
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

describe("assignSessionLessons (#211)", () => {
  const drafts: LessonTodoDraft[] = [
    draft,
    { ...draft, kind: "exercise", target: "u1-e1", href: "/practice/exercises/" },
  ];

  it("asigna todas las lecciones del cierre y las ata a la conversación", async () => {
    const f = fakeRepo();
    const next = await assignSessionLessons({ repo: f.repo, drafts, conversationId: "c1", now: 5 });
    expect(next.map((t) => t.kind)).toEqual(["srs-review", "exercise"]);
    expect(next.every((t) => t.origin.conversationId === "c1" && t.status === "pending")).toBe(true);
  });

  it("es idempotente: reabrir o re-ejecutar el cierre no duplica ni reescribe", async () => {
    const f = fakeRepo();
    await assignSessionLessons({ repo: f.repo, drafts, conversationId: "c1", now: 5 });
    const spy = vi.spyOn(f.repo, "saveAll");
    const again = await assignSessionLessons({ repo: f.repo, drafts, conversationId: "c1", now: 9 });
    expect(again).toHaveLength(2);
    expect(spy).not.toHaveBeenCalled();
  });

  it("no reasigna una lección ya completada de la misma conversación", async () => {
    const f = fakeRepo();
    const first = await assignSessionLessons({ repo: f.repo, drafts, conversationId: "c1", now: 5 });
    await completeLessonTodoUseCase({ repo: f.repo, id: first[0].id, now: 6 });
    const again = await assignSessionLessons({ repo: f.repo, drafts, conversationId: "c1", now: 9 });
    expect(again).toHaveLength(2);
    expect(again.filter((t) => t.status === "pending")).toHaveLength(1);
  });

  it("otra conversación con el mismo objetivo pendiente no lo duplica", async () => {
    const f = fakeRepo();
    await assignSessionLessons({ repo: f.repo, drafts, conversationId: "c1", now: 5 });
    const other = await assignSessionLessons({ repo: f.repo, drafts, conversationId: "c2", now: 9 });
    expect(other).toHaveLength(2);
  });
});
