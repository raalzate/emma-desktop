import { describe, it, expect } from "vitest";
import { runChatTurn } from "../run-chat-turn-use-case";
import type { LlmGenerate } from "@/domain/ai/llm-port";

const history = [
  { role: "assistant" as const, content: "The merge failed this morning." },
  { role: "user" as const, content: "Oh no, what happened?" },
];

const base = { system: "system", history, userMessage: "Can we fix it before the demo?" };

/** LLM falso que devuelve las líneas en orden y guarda los prompts vistos. */
function scripted(lines: string[]) {
  const prompts: string[] = [];
  const llm: LlmGenerate = async (a) => {
    prompts.push(a.prompt);
    return lines[Math.min(prompts.length - 1, lines.length - 1)];
  };
  return { llm, prompts };
}

describe("runChatTurn con juez de escena", () => {
  it("rechazo del primer intento: regenera con un nudge que nombra el problema", async () => {
    const { llm, prompts } = scripted(["Let me teach you some grammar rules.", "Yes, the rollback is ready."]);
    const reply = await runChatTurn({
      ...base,
      llm,
      judgeReply: async (r) =>
        /grammar/.test(r) ? { inScene: false, issue: "wrong-role" } : { inScene: true, issue: null },
    });
    expect(reply).toBe("Yes, the rollback is ready.");
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain("left the scene (wrong-role)");
    expect(prompts[1]).toContain("SCENE FACTS");
  });

  it("si el juez acepta el primer intento no hay reintento", async () => {
    const { llm, prompts } = scripted(["Yes, the rollback is ready."]);
    const reply = await runChatTurn({
      ...base,
      llm,
      judgeReply: async () => ({ inScene: true, issue: null }),
    });
    expect(reply).toBe("Yes, the rollback is ready.");
    expect(prompts).toHaveLength(1);
  });

  it("rechazo del segundo intento: sigue a la reformulación, que no se juzga", async () => {
    const judged: string[] = [];
    const { llm, prompts } = scripted([
      "Bad line one.",
      "Bad line two.",
      "The merge failed this morning, I think.",
    ]);
    const reply = await runChatTurn({
      ...base,
      llm,
      judgeReply: async (r) => {
        judged.push(r);
        return /Bad/.test(r) ? { inScene: false, issue: "other-scene" } : { inScene: true, issue: null };
      },
    });
    expect(prompts).toHaveLength(3);
    expect(judged).toEqual(["Bad line one.", "Bad line two."]);
    expect(reply).toBe("The merge failed this morning, I think.");
  });

  it("si el juez rechaza todo y la reformulación no sirve, cae a la recuperación anclada", async () => {
    const { llm } = scripted(["Bad line.", "Bad line.", "Bad line."]);
    const reply = await runChatTurn({
      ...base,
      llm,
      judgeReply: async () => ({ inScene: false, issue: "breaks-fiction" }),
      validateReply: (r) => !/Bad/.test(r),
    });
    expect(reply).not.toMatch(/Bad/);
    expect(reply.length).toBeGreaterThan(10);
  });

  it("sin judgeReply el comportamiento es el de siempre", async () => {
    const { llm, prompts } = scripted(["Let me teach you some grammar rules."]);
    const reply = await runChatTurn({ ...base, llm });
    expect(reply).toBe("Let me teach you some grammar rules.");
    expect(prompts).toHaveLength(1);
  });
});
