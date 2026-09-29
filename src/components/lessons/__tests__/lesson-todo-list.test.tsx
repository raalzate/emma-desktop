/**
 * #198 (FR-007) — descartar una lección salta la práctica que la desbloquea:
 * la lista ya no ofrece «Dismiss», solo «Done» y «Start».
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonTodoList } from "@/components/lessons/lesson-todo-list";

vi.mock("@/components/lessons/use-lesson-todos", () => ({
  useLessonTodos: () => ({
    pending: [
      {
        id: "exercise:u13-fill:1",
        kind: "exercise",
        target: "u13-fill",
        titleEs: "Ejercicio",
        reasonEs: "razón",
        href: "/practice?tab=exercises&unit=13&exercise=u13-fill",
        origin: { sessionAt: 1, scenarioType: "s1", scenarioTitle: "Ordering Coffee" },
        status: "pending",
        createdAt: 1,
      },
    ],
    todos: [],
    loading: false,
    complete: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

function render(): string {
  return renderToStaticMarkup(createElement(LessonTodoList));
}

describe("LessonTodoList — sin descartar lecciones (FR-007, #198)", () => {
  it("no ofrece «Dismiss»: sólo Start y Done", () => {
    const html = render();
    expect(html).not.toContain("Dismiss");
    expect(html).toContain("Start");
    expect(html).toContain("Done");
  });
});
