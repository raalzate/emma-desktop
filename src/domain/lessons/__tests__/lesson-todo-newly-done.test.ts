import { describe, it, expect } from "vitest";
import { newlyDoneCount, type LessonTodo } from "../lesson-todo";

function todo(id: string, status: LessonTodo["status"]): LessonTodo {
  return { id, status, createdAt: 0 } as LessonTodo;
}

describe("newlyDoneCount", () => {
  it("cuenta las lecciones que pasaron a hechas", () => {
    const before = [todo("a", "pending"), todo("b", "pending"), todo("c", "done")];
    const after = [todo("a", "done"), todo("b", "pending"), todo("c", "done")];
    expect(newlyDoneCount(before, after)).toBe(1);
  });

  it("descartar no cuenta como hecha", () => {
    expect(newlyDoneCount([todo("a", "pending")], [todo("a", "dismissed")])).toBe(0);
  });

  it("una lección nueva ya hecha no existía antes como pendiente y no cuenta", () => {
    expect(newlyDoneCount([], [todo("z", "done")])).toBe(0);
  });
});
