/**
 * #198 (FR-006) — una escena nueva no arranca si el aprendiz tiene lecciones
 * pendientes que no sean justo esa escena; repetir una ya superada o retomar
 * la escena pendiente de práctica sí se permite.
 */

import { describe, it, expect } from "vitest";
import { canStartScenario } from "../scenario-gate";
import type { LessonTodo } from "../lesson-todo";

const origin = {
  sessionAt: 1_700_000_000_000,
  scenarioType: "daily_standup",
  scenarioTitle: "Daily Standup",
};

const todo = (over: Partial<LessonTodo> = {}): LessonTodo => ({
  id: "exercise:u13-fill:1",
  kind: "exercise",
  target: "u13-fill",
  titleEs: "Ejercicio",
  reasonEs: "razón",
  href: "/practice?tab=exercises&unit=13&exercise=u13-fill",
  origin,
  status: "pending",
  createdAt: 1,
  ...over,
});

describe("canStartScenario", () => {
  it("sin lecciones pendientes, cualquier escena está permitida", () => {
    expect(canStartScenario("sprint_planning", [], [])).toEqual({ allowed: true });
  });

  it("con lecciones pendientes, una escena ya superada se puede repetir", () => {
    const todos = [todo()];
    expect(canStartScenario("daily_standup", todos, ["daily_standup"])).toEqual({
      allowed: true,
    });
  });

  it("con lecciones pendientes, la escena objetivo de una lección de tipo escenario se permite", () => {
    const todos = [todo({ kind: "scenario", target: "sprint_planning" })];
    expect(canStartScenario("sprint_planning", todos, [])).toEqual({ allowed: true });
  });

  it("con lecciones pendientes, una escena nueva sin relación se bloquea", () => {
    const todos = [todo()];
    expect(canStartScenario("sprint_planning", todos, [])).toEqual({
      allowed: false,
      reason: "pending_todos",
    });
  });

  it("las lecciones ya cerradas (done/dismissed) no cuentan como pendientes", () => {
    const todos = [todo({ status: "done" }), todo({ id: "x", status: "dismissed" })];
    expect(canStartScenario("sprint_planning", todos, [])).toEqual({ allowed: true });
  });

  it("una lección de tipo escenario pendiente de OTRA escena no la desbloquea", () => {
    const todos = [todo({ kind: "scenario", target: "sprint_planning" })];
    expect(canStartScenario("retro_meeting", todos, [])).toEqual({
      allowed: false,
      reason: "pending_todos",
    });
  });
});
