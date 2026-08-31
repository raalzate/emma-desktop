import { describe, it, expect } from "vitest";
import type { LlmGenerate, LlmGenerateArgs } from "@/domain/ai/llm-port";
import { createSceneContract } from "../create-scene-contract-use-case";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";

const scenario = {
  scenarioType: "daily_standup",
  title: "Daily Standup",
  description: "Run a daily standup meeting with your team",
  category: "AGILE",
  cefrRange: ["A1", "C1"],
  emmaRole: "Scrum Master",
  roleSystemPrompt: "You are a Scrum Master.",
  tier: "basics",
} as unknown as Scenario;

const situation = {
  id: "daily_standup.routine_update",
  scenarioType: "daily_standup",
  character: "routine",
  cefrLevels: ["B1"],
  stackHints: [],
  retired: false,
  title: "Quiet sprint morning",
  framingDescription:
    "The sprint is on track. Deliver a concise update and flag the risk from yesterday's code review.",
} as unknown as SituationVariant;

function scriptedLlm(replies: string[]): { llm: LlmGenerate; calls: LlmGenerateArgs[] } {
  const calls: LlmGenerateArgs[] = [];
  const llm: LlmGenerate = async (args) => {
    calls.push(args);
    return replies[Math.min(calls.length - 1, replies.length - 1)];
  };
  return { llm, calls };
}

describe("createSceneContract — creador de escenario (BUG-001)", () => {
  it("genera hechos EN válidos y la narrativa ES a partir de ESOS hechos", async () => {
    const facts =
      "Project: payments API on sprint 14.\nYesterday: login fix merged.\nToday: demo at 3 PM, one risk from code review.";
    const { llm, calls } = scriptedLlm([
      facts,
      "Te reúnes con Sofía para el daily. Ayer integraste el fix de login y hoy hay demo a las 3 PM.",
    ]);
    const contract = await createSceneContract({ llm, scenario, situation, techStack: "backend" });
    expect(contract.facts).toBe(facts);
    expect(contract.narrative).toContain("Sofía");
    // La narrativa se genera DESDE los hechos (mismo contrato en ambos lados).
    expect(calls[1].prompt).toContain("payments API on sprint 14");
  });

  it("si los hechos del LLM son basura usa el framing como contrato determinista", async () => {
    const { llm } = scriptedLlm(["ถ้าคุณต้องการ ให้ฉันช่วย", "narrativa"]);
    const contract = await createSceneContract({ llm, scenario, situation });
    expect(contract.facts).toBe(situation.framingDescription);
  });

  it("si el LLM lanza error devuelve contrato determinista sin narrativa", async () => {
    const llm: LlmGenerate = async () => {
      throw new Error("engine down");
    };
    const contract = await createSceneContract({ llm, scenario, situation });
    expect(contract.facts).toBe(situation.framingDescription);
    expect(contract.narrative).toBeNull();
  });
});
