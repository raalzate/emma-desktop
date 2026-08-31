import { describe, expect, it } from "vitest";

import { CEFR_LADDER } from "@/domain/cefr/cefr-ladder";
import { GoalContextBuilder } from "@/domain/goals/goal-context";
import { createUserGoal } from "@/domain/goals/user-goal";
import { situationsFor } from "@/domain/situations/situations-catalog";
import { ALL_SCENARIOS } from "@/lib/scenarios-data";
import { SCENARIOS_CURRICULUM } from "@/lib/scenarios-data-curriculum";

const NUEVOS_IDS = [
  "system_walkthrough",
  "slack_thread",
  "tech_comparison",
  "documentation_workshop",
  "meeting_recap",
  "multi_team_sync",
  "salary_negotiation",
];

describe("SCENARIOS_CURRICULUM (English for Software Engineers)", () => {
  it("expone exactamente los 7 escenarios nuevos", () => {
    expect(SCENARIOS_CURRICULUM).toHaveLength(7);
    expect(SCENARIOS_CURRICULUM.map((s) => s.scenarioType).sort()).toEqual(
      [...NUEVOS_IDS].sort(),
    );
  });

  it("se integran en ALL_SCENARIOS sin duplicar ids", () => {
    const tipos = ALL_SCENARIOS.map((s) => s.scenarioType);
    const unicos = new Set(tipos);
    expect(unicos.size).toBe(tipos.length);
    for (const id of NUEVOS_IDS) {
      expect(tipos).toContain(id);
    }
  });

  it("cada escenario nuevo tiene un rango CEFR contiguo y válido", () => {
    for (const escenario of SCENARIOS_CURRICULUM) {
      const [min, max] = escenario.cefrRange;
      const idxMin = CEFR_LADDER.indexOf(min);
      const idxMax = CEFR_LADDER.indexOf(max);
      expect(idxMin).toBeGreaterThanOrEqual(0);
      expect(idxMax).toBeGreaterThanOrEqual(0);
      expect(idxMin).toBeLessThanOrEqual(idxMax);
    }
  });

  it("cada escenario nuevo tiene al menos 3 situaciones en el catálogo", () => {
    for (const id of NUEVOS_IDS) {
      const variantes = situationsFor(id);
      expect(variantes.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("goal-context resuelve slack_thread y multi_team_sync contra ALL_SCENARIOS (repara inconsistencia legada)", () => {
    const builder = new GoalContextBuilder();
    const ctx = builder.build(1, [
      createUserGoal(1, "Written Communication", 0.75, "2026-01-01T00:00:00Z"),
      createUserGoal(1, "International Meetings", 0.7, "2026-01-01T00:00:00Z"),
    ]);
    const tipos = new Set(ALL_SCENARIOS.map((s) => s.scenarioType));
    for (const scenarioType of ctx.scenarioPriorities) {
      expect(tipos.has(scenarioType)).toBe(true);
    }
  });
});
