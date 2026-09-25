/**
 * #172 — el feedback anota, el estudiante cierra. Reglas puras de la lista de
 * lecciones pendientes: deduplicación por clase+objetivo y transiciones de
 * estado que sólo salen de `pending`.
 */

import { describe, it, expect } from "vitest";
import {
  addLessonTodo,
  completeLessonTodo,
  dismissLessonTodo,
  isLessonTodo,
  pendingLessonTodos,
  type LessonTodo,
  type LessonTodoDraft,
} from "../lesson-todo";

const origin = {
  sessionAt: 1_700_000_000_000,
  scenarioType: "daily_standup",
  scenarioTitle: "Daily Standup",
};

const draft = (over: Partial<LessonTodoDraft> = {}): LessonTodoDraft => ({
  kind: "exercise",
  target: "u13-fill-articles",
  titleEs: "Ejercicio de artículos",
  reasonEs: "Se te fueron los artículos en esta sesión",
  href: "/practice?tab=exercises&unit=13&exercise=u13-fill-articles",
  origin,
  ...over,
});

describe("addLessonTodo", () => {
  it("anota la lección como pendiente, con su origen y su porqué", () => {
    const [todo] = addLessonTodo([], draft(), 1_700_000_100_000);
    expect(todo.status).toBe("pending");
    expect(todo.origin.scenarioTitle).toBe("Daily Standup");
    expect(todo.reasonEs).toContain("artículos");
    expect(todo.createdAt).toBe(1_700_000_100_000);
    expect(todo.id).toBeTruthy();
  });

  it("no duplica: misma clase y mismo objetivo es una sola entrada", () => {
    const uno = addLessonTodo([], draft(), 1);
    const dos = addLessonTodo(uno, draft({ reasonEs: "otro texto" }), 2);
    expect(dos).toHaveLength(1);
    expect(dos[0].reasonEs).toContain("artículos");
  });

  it("distingue objetivos distintos de la misma clase", () => {
    const uno = addLessonTodo([], draft(), 1);
    const dos = addLessonTodo(uno, draft({ target: "u14-order" }), 2);
    expect(dos).toHaveLength(2);
  });

  it("una lección ya cerrada no bloquea volver a recomendarla", () => {
    const uno = addLessonTodo([], draft(), 1);
    const cerrada = completeLessonTodo(uno, uno[0].id, 2);
    const otra = addLessonTodo(cerrada, draft(), 3);
    expect(otra).toHaveLength(2);
    expect(pendingLessonTodos(otra)).toHaveLength(1);
  });
});

describe("transiciones", () => {
  const base = addLessonTodo([], draft(), 1);

  it("completar la saca de pendientes y le pone fecha de cierre", () => {
    const [todo] = completeLessonTodo(base, base[0].id, 99);
    expect(todo.status).toBe("done");
    expect(todo.closedAt).toBe(99);
    expect(pendingLessonTodos([todo])).toEqual([]);
  });

  it("descartar la saca de la lista de pendientes sin haberla hecho", () => {
    const [todo] = dismissLessonTodo(base, base[0].id, 99);
    expect(todo.status).toBe("dismissed");
    expect(todo.closedAt).toBe(99);
  });

  it("una lección ya cerrada no vuelve a cambiar de estado", () => {
    const hecha = completeLessonTodo(base, base[0].id, 99);
    expect(dismissLessonTodo(hecha, base[0].id, 100)).toEqual(hecha);
  });

  it("un id desconocido deja la lista igual", () => {
    expect(completeLessonTodo(base, "no-existe", 100)).toEqual(base);
  });
});

describe("isLessonTodo — guarda del store JSON", () => {
  const valida: LessonTodo = addLessonTodo([], draft(), 1)[0];

  it("acepta una entrada íntegra", () => {
    expect(isLessonTodo(valida)).toBe(true);
  });

  it("rechaza lo que viene de otra versión o editado a mano", () => {
    expect(isLessonTodo(null)).toBe(false);
    expect(isLessonTodo({ ...valida, status: "archivada" })).toBe(false);
    expect(isLessonTodo({ ...valida, kind: "inventada" })).toBe(false);
    expect(isLessonTodo({ ...valida, id: 7 })).toBe(false);
    expect(isLessonTodo({ ...valida, origin: undefined })).toBe(false);
  });
});
