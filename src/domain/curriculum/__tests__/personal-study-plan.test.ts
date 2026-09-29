/**
 * Plan de estudio personal: las 24 semanas leídas desde donde está el
 * aprendiz (semana actual, hechas y por venir), con el foco de cada semana
 * en lenguaje de producto y el avance real de retos.
 */

import { describe, expect, it } from "vitest";
import { buildPersonalStudyPlan } from "../personal-study-plan";
import { challengesForUnit } from "../challenge-selection";

describe("buildPersonalStudyPlan", () => {
  it("sin unidad activa está en la semana 1 y el foco es sonidos, sin jerga de capítulos", () => {
    const plan = buildPersonalStudyPlan({ activeUnit: null, completedChallengeIds: [] });
    expect(plan.current.week).toBe(1);
    expect(plan.current.focusEs).toMatch(/Sounds/);
    expect(plan.current.focusEs).not.toMatch(/Parte|§|libro/);
    expect(plan.weeks).toHaveLength(24);
  });

  it("marca hechas las semanas anteriores, actual la de la unidad activa y por venir el resto", () => {
    const plan = buildPersonalStudyPlan({ activeUnit: 3, completedChallengeIds: [] });
    expect(plan.current.week).toBe(5);
    expect(plan.weeks[3].status).toBe("done");
    expect(plan.weeks[4].status).toBe("current");
    expect(plan.weeks[5].status).toBe("upcoming");
  });

  it("nombra la unidad con su título y cuenta los retos hechos de esa semana", () => {
    const firstOfUnit3 = challengesForUnit(3)[0].id;
    const plan = buildPersonalStudyPlan({ activeUnit: 3, completedChallengeIds: [firstOfUnit3] });
    expect(plan.current.focusEs).toMatch(/Unit 3 · /);
    expect(plan.current.challenges.total).toBe(challengesForUnit(3).length);
    expect(plan.current.challenges.done).toBe(1);
  });

  it("la lista de esta semana dice qué hacer en la app: lección, ejercicios, retos e hito", () => {
    const plan = buildPersonalStudyPlan({ activeUnit: 3, completedChallengeIds: [] });
    const joined = plan.thisWeekEs.join(" | ");
    expect(joined).toMatch(/unit 3 lesson/i);
    expect(joined).toMatch(/exercises/i);
    expect(joined).toMatch(/challenges/i);
    expect(joined).toMatch(/milestone/i);
  });

  it("no menciona el libro en ningún texto del plan", () => {
    const plan = buildPersonalStudyPlan({ activeUnit: 10, completedChallengeIds: [] });
    const all = [plan.thisWeekEs.join(" "), ...plan.weeks.map((w) => w.focusEs)].join(" ");
    expect(all).not.toMatch(/libro|Parte \d|§/);
  });
});
