import { describe, expect, it, vi, afterEach } from "vitest";
import { judgeSceneFidelity } from "../judge-scene-fidelity-use-case";
import type { LlmGenerate } from "@/domain/ai/llm-port";

afterEach(() => {
  vi.useRealTimers();
});

const base = {
  facts: "The Java service merge failed. Stakeholder demo at 2 PM.",
  personaName: "Sofía Torres",
  personaRole: "Scrum Master",
  situationTitle: "Failed merge",
};

describe("judgeSceneFidelity", () => {
  it("rechaza con el veredicto del LLM", async () => {
    const llm: LlmGenerate = async () => '{"inScene":false,"issue":"wrong-role"}';
    const v = await judgeSceneFidelity({ llm, ...base, reply: "Let me teach you grammar." });
    expect(v).toEqual({ inScene: false, issue: "wrong-role", source: "judge" });
  });

  it("acepta cuando el LLM dice que está en escena", async () => {
    const llm: LlmGenerate = async () => '{"inScene":true,"issue":null}';
    const v = await judgeSceneFidelity({ llm, ...base, reply: "Did the merge pass?" });
    expect(v).toEqual({ inScene: true, issue: null, source: "judge" });
  });

  it("rechaza por deriva de hora sin gastar la llamada al LLM", async () => {
    const llm = vi.fn<LlmGenerate>(async () => '{"inScene":true,"issue":null}');
    const v = await judgeSceneFidelity({ llm, ...base, reply: "The demo is at 4 PM." });
    expect(v).toEqual({ inScene: false, issue: "contradicts-facts", source: "time-check" });
    expect(llm).not.toHaveBeenCalled();
  });

  it("acepta si el LLM devuelve basura", async () => {
    const llm: LlmGenerate = async () => "no idea";
    const v = await judgeSceneFidelity({ llm, ...base, reply: "Did the merge pass?" });
    expect(v).toMatchObject({ inScene: true, source: "fail-open" });
  });

  it("acepta si el LLM falla", async () => {
    const llm: LlmGenerate = async () => {
      throw new Error("boom");
    };
    const v = await judgeSceneFidelity({ llm, ...base, reply: "Did the merge pass?" });
    expect(v).toMatchObject({ inScene: true, source: "fail-open" });
  });

  it("acepta si el LLM se pasa del presupuesto de reloj", async () => {
    vi.useFakeTimers();
    const llm: LlmGenerate = () => new Promise<string>(() => {});
    const pending = judgeSceneFidelity({ llm, ...base, reply: "Did the merge pass?" });
    await vi.advanceTimersByTimeAsync(4001);
    expect(await pending).toMatchObject({ inScene: true, source: "fail-open" });
  });

  it("acepta sin llamar al LLM cuando no hay hechos que juzgar", async () => {
    const llm = vi.fn<LlmGenerate>(async () => '{"inScene":false,"issue":"wrong-role"}');
    const v = await judgeSceneFidelity({ llm, ...base, facts: "  ", reply: "Hello." });
    expect(v).toMatchObject({ inScene: true, source: "fail-open" });
    expect(llm).not.toHaveBeenCalled();
  });
});
