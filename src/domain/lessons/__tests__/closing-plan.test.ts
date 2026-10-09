/**
 * #211 — plan de cierre de la simulación: con correcciones reportables las
 * lecciones se asignan solas; sin ellas, el aprendiz elige.
 */

import { describe, it, expect } from "vitest";
import { closingPlanFor } from "../closing-plan";
import type { PracticeRecommendation } from "@/domain/tutor/practice-recommender";
import type { LessonTodoOrigin } from "../lesson-todo";

const origin: LessonTodoOrigin = {
  sessionAt: 10,
  scenarioType: "daily_standup",
  scenarioTitle: "Daily Standup",
};

const exercise: PracticeRecommendation = {
  kind: "exercise",
  unit: 1,
  exerciseId: "u1-e1",
  reasonEs: "Practica el verbo to be",
} as PracticeRecommendation;
const srs = { kind: "srs-review", reasonEs: "Tienes tarjetas", due: 3 } as PracticeRecommendation;
const pair = {
  kind: "minimal-pair",
  contrastId: "ship-sheep",
  reasonEs: "Pronunciación",
} as PracticeRecommendation;
const scenario = {
  kind: "scenario",
  scenarioType: "job_interview",
  reasonEs: "Siguiente escena",
} as PracticeRecommendation;
const challenge = { unit: 2, instructionsEs: "Cuenta tu día" };

describe("closingPlanFor", () => {
  it("sin correcciones reportables propone elegir (practicar o continuar)", () => {
    const plan = closingPlanFor({
      correctionsCount: 0,
      recommendations: [exercise],
      challenge,
      origin,
    });
    expect(plan).toEqual({ kind: "choice" });
  });

  it("con correcciones asigna la remediación y excluye los escenarios", () => {
    const plan = closingPlanFor({
      correctionsCount: 2,
      recommendations: [exercise, srs, pair, scenario],
      challenge: null,
      origin,
    });
    expect(plan.kind).toBe("lessons");
    if (plan.kind !== "lessons") return;
    expect(plan.drafts.map((d) => d.kind)).toEqual(["exercise", "srs-review", "minimal-pair"]);
  });

  it("incluye el reto de la unidad si existe", () => {
    const plan = closingPlanFor({
      correctionsCount: 1,
      recommendations: [exercise],
      challenge,
      origin,
    });
    if (plan.kind !== "lessons") throw new Error("se esperaba lessons");
    expect(plan.drafts.map((d) => d.kind)).toEqual(["exercise", "challenge"]);
    expect(plan.drafts[1].target).toBe("unit-2");
  });

  it("con correcciones pero sin ningún draft cae a elegir", () => {
    const plan = closingPlanFor({
      correctionsCount: 3,
      recommendations: [scenario],
      challenge: null,
      origin,
    });
    expect(plan).toEqual({ kind: "choice" });
  });
});
