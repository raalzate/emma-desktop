import { describe, it, expect } from "vitest";
import { buildSceneBriefing } from "../scene-briefing";
import type { SituationVariant } from "../situation-variant";

const situation: SituationVariant = {
  id: "daily_standup.routine_update",
  scenarioType: "daily_standup",
  title: "Quiet sprint morning",
  framingDescription:
    "The sprint is on track and no blockers are in flight. Deliver a concise standup " +
    "update, keep ceremony time short, and flag the one risk you spotted in yesterday's code review.",
  character: "routine",
  cefrLevels: ["A1"],
  stackHints: [],
  retired: false,
};

describe("buildSceneBriefing", () => {
  it("genera una ambientación hipotética en inglés según el carácter", () => {
    const b = buildSceneBriefing(situation);
    expect(b.hypothetical).toMatch(/^Picture/);
    // routine → jornada normal, sin urgencias
    expect(b.hypothetical).toMatch(/ordinary|quiet/i);
  });

  it("ninguna ambientación deja rastros en español (la escena es ficción en inglés)", () => {
    const chars = ["incident", "conflict", "onboarding", "routine"] as const;
    for (const c of chars) {
      const { hypothetical } = buildSceneBriefing({ ...situation, character: c });
      expect(hypothetical).not.toMatch(/[áéíóúñ¿¡]/i);
      expect(hypothetical).not.toMatch(/\b(imagina|equipo|que|tu)\b/i);
    }
  });

  it("parte la misión en objetivos por oración (inglés intacto)", () => {
    const b = buildSceneBriefing(situation);
    expect(b.missionLines).toHaveLength(2);
    expect(b.missionLines[0]).toBe("The sprint is on track and no blockers are in flight.");
    expect(b.missionLines[1]).toMatch(/^Deliver a concise standup update/);
  });

  it("cada carácter tiene su propia ambientación", () => {
    const chars = ["incident", "conflict", "onboarding", "routine"] as const;
    const texts = chars.map(
      (c) => buildSceneBriefing({ ...situation, character: c }).hypothetical,
    );
    expect(new Set(texts).size).toBe(chars.length);
  });

  it("framing vacío produce misión vacía sin fallar", () => {
    const b = buildSceneBriefing({ ...situation, framingDescription: "" });
    expect(b.missionLines).toEqual([]);
    expect(b.hypothetical.length).toBeGreaterThan(0);
  });
});
