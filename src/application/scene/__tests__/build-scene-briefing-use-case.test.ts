import { describe, it, expect } from "vitest";
import { buildImmersiveBriefing } from "../build-scene-briefing-use-case";
import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";

const scenario: Scenario = {
  scenarioType: "daily_standup",
  title: "Daily Standup",
  description: "Report yesterday's work, today's plan and blockers.",
  category: "meetings",
  cefrRange: ["A1", "B1"],
  emmaRole: "Scrum Master",
  roleSystemPrompt: "You are the Scrum Master.",
  tier: "basics",
};

const situation: SituationVariant = {
  id: "daily_standup.blocker_dependency",
  scenarioType: "daily_standup",
  title: "Blocked by another team's deliverable",
  framingDescription:
    "Your work is blocked by another team that has not delivered the API contract. " +
    "Lead the standup: state the blocker plainly and what you need to move forward.",
  character: "conflict",
  cefrLevels: ["B1"],
  stackHints: [],
  retired: false,
};

describe("buildImmersiveBriefing", () => {
  it("devuelve la narrativa en español generada por el LLM (recortada)", async () => {
    const llm: LlmGenerate = async () =>
      "  El proyecto lleva 3 días atrasado: el equipo de plataforma no entregó el contrato del API y tu integración de pagos está congelada. Hoy diriges el standup y el equipo espera un plan.  ";
    const r = await buildImmersiveBriefing({ llm, scenario, situation, techStack: "Python, AWS" });
    expect(r.narrative).toMatch(/^El proyecto lleva 3 días atrasado/);
    expect(r.narrative?.endsWith(" ")).toBe(false);
  });

  it("el prompt pide español, segunda persona y detalles concretos", async () => {
    let seenSystem = "";
    let seenPrompt = "";
    const llm: LlmGenerate = async (args) => {
      seenSystem = args.system ?? "";
      seenPrompt = args.prompt;
      return "Narrativa.";
    };
    await buildImmersiveBriefing({ llm, scenario, situation });
    expect(seenSystem).toMatch(/SPANISH/i);
    expect(seenSystem).toMatch(/second person|segunda persona/i);
    expect(seenPrompt).toMatch(/Blocked by another team/);
  });

  it("fallo del LLM o respuesta vacía → narrative null (el caller usa el fallback estático)", async () => {
    const failing: LlmGenerate = async () => {
      throw new Error("boom");
    };
    const empty: LlmGenerate = async () => "   ";
    expect((await buildImmersiveBriefing({ llm: failing, scenario, situation })).narrative).toBeNull();
    expect((await buildImmersiveBriefing({ llm: empty, scenario, situation })).narrative).toBeNull();
  });

  it("respuesta absurdamente larga se descarta (guard en el borde)", async () => {
    const llm: LlmGenerate = async () => "x".repeat(2000);
    const r = await buildImmersiveBriefing({ llm, scenario, situation });
    expect(r.narrative).toBeNull();
  });
});
