/**
 * Cuando el aprendiz termina la actividad que la lección pedía (cerró el
 * repaso, entregó el reto), la lección se cierra sola: obligarlo a pulsar
 * «Done» además de haberla hecho es lo que dejaba «Repaso de tus tarjetas»
 * pendiente después de repasar.
 */

import { describe, it, expect } from "vitest";
import { addLessonTodo, completeLessonTodosByKind, pendingLessonTodos, type LessonTodoDraft } from "../lesson-todo";

const origin = { sessionAt: 1, scenarioType: "daily_standup", scenarioTitle: "Daily Standup" };
const draft = (over: Partial<LessonTodoDraft>): LessonTodoDraft => ({
  kind: "srs-review",
  target: "due",
  titleEs: "Review your cards",
  reasonEs: "5 cards due for review",
  href: "/practice?tab=srs",
  origin,
  ...over,
});

describe("completeLessonTodosByKind", () => {
  const list = addLessonTodo(
    addLessonTodo(addLessonTodo([], draft({}), 10), draft({ kind: "challenge", target: "unit-4" }), 11),
    draft({ kind: "challenge", target: "unit-5" }),
    12,
  );

  it("terminar el repaso cierra la lección de repaso y deja las demás", () => {
    const next = completeLessonTodosByKind(list, "srs-review", 100);
    expect(pendingLessonTodos(next).map((t) => t.target)).toEqual(["unit-4", "unit-5"]);
    expect(next.find((t) => t.kind === "srs-review")?.closedAt).toBe(100);
  });

  it("con objetivo, sólo cierra la lección de ese objetivo", () => {
    const next = completeLessonTodosByKind(list, "challenge", 100, "unit-4");
    expect(pendingLessonTodos(next).map((t) => t.target)).toEqual(["due", "unit-5"]);
  });

  it("sin lección pendiente de esa clase, la lista queda igual", () => {
    expect(completeLessonTodosByKind(list, "exercise", 100)).toEqual(list);
  });
});
