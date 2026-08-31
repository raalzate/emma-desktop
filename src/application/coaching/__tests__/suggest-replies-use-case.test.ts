import { describe, it, expect } from "vitest";
import type { LlmGenerate, LlmGenerateArgs } from "@/domain/ai/llm-port";
import { REPLIES_MAX_TOKENS } from "@/domain/shared/token-budgets";
import {
  SUGGEST_REPLIES_ANSWER_RULES,
  SUGGEST_REPLIES_SYSTEM_PROMPT,
  SUGGEST_REPLIES_WITH_DRAFT_APPENDIX,
} from "@/domain/coaching/reply-suggestion";
import { suggestReplies } from "../suggest-replies-use-case";

/** LLM falso que devuelve un texto fijo y captura los args recibidos. */
function fakeLlm(reply: string): { llm: LlmGenerate; calls: LlmGenerateArgs[] } {
  const calls: LlmGenerateArgs[] = [];
  const llm: LlmGenerate = async (args) => {
    calls.push(args);
    return reply;
  };
  return { llm, calls };
}

describe("suggestReplies", () => {
  it("mapea 3 strings a easy/mid/advanced en orden", async () => {
    const { llm } = fakeLlm('["Sure.","I can help with that.","Absolutely, let me look into it."]');
    const out = await suggestReplies({ llm, context: "ctx", level: "B1" });
    expect(out).toEqual([
      { text: "Sure.", levelHint: "easy" },
      { text: "I can help with that.", levelHint: "mid" },
      { text: "Absolutely, let me look into it.", levelHint: "advanced" },
    ]);
  });

  it("recorta a 3 antes de filtrar y descarta el excedente", async () => {
    const { llm } = fakeLlm('["a","b","c","d"]');
    const out = await suggestReplies({ llm, context: "ctx", level: "A2" });
    expect(out.map((s) => s.text)).toEqual(["a", "b", "c"]);
  });

  it("recorta espacios de cada sugerencia", async () => {
    const { llm } = fakeLlm('["  hola  "]');
    const out = await suggestReplies({ llm, context: "ctx", level: "A1" });
    expect(out).toEqual([{ text: "hola", levelHint: "easy" }]);
  });

  it("salta un item inválido pero conserva el level_hint de los válidos por índice", async () => {
    // index0 inválido -> se salta "easy"; "b"->mid, "c"->advanced.
    const { llm } = fakeLlm('["","b","c"]');
    const out = await suggestReplies({ llm, context: "ctx", level: "B1" });
    expect(out).toEqual([
      { text: "b", levelHint: "mid" },
      { text: "c", levelHint: "advanced" },
    ]);
  });

  it("devuelve [] cuando el LLM no produce un array JSON", async () => {
    const { llm } = fakeLlm("lo siento, no puedo");
    const out = await suggestReplies({ llm, context: "ctx", level: "B1" });
    expect(out).toEqual([]);
  });

  it("pasa el system prompt, el prompt de dominio y el presupuesto de tokens al LLM", async () => {
    const { llm, calls } = fakeLlm("[]");
    await suggestReplies({ llm, context: "el contexto", level: "B2" });
    expect(calls).toHaveLength(1);
    expect(calls[0].system).toBe(SUGGEST_REPLIES_SYSTEM_PROMPT + SUGGEST_REPLIES_ANSWER_RULES);
    expect(calls[0].prompt).toBe("CEFR: B2\nel contexto");
    expect(calls[0].maxTokens).toBe(REPLIES_MAX_TOKENS);
  });

  it("propaga el error si el puerto LLM lanza", async () => {
    const failing: LlmGenerate = async () => {
      throw new Error("boom");
    };
    await expect(
      suggestReplies({ llm: failing, context: "ctx", level: "B1" }),
    ).rejects.toThrow("boom");
  });

  it("sin draft, el system es el original + reglas de respuesta (sin apéndice de draft)", async () => {
    const { llm, calls } = fakeLlm("[]");
    await suggestReplies({ llm, context: "el contexto", level: "B2" });
    expect(calls[0].system).toBe(SUGGEST_REPLIES_SYSTEM_PROMPT + SUGGEST_REPLIES_ANSWER_RULES);
  });

  it("con draft, el prompt incluye el borrador y el system incluye el apéndice", async () => {
    const { llm, calls } = fakeLlm("[]");
    await suggestReplies({ llm, context: "el contexto", level: "B2", draft: "I think we should" });
    expect(calls[0].prompt).toContain('Learner\'s current draft: "I think we should"');
    expect(calls[0].system).toBe(
      SUGGEST_REPLIES_SYSTEM_PROMPT + SUGGEST_REPLIES_ANSWER_RULES + SUGGEST_REPLIES_WITH_DRAFT_APPENDIX,
    );
  });

  it("draft vacío o solo espacios se comporta como sin draft", async () => {
    const { llm, calls } = fakeLlm("[]");
    await suggestReplies({ llm, context: "ctx", level: "B1", draft: "   " });
    expect(calls[0].system).toBe(SUGGEST_REPLIES_SYSTEM_PROMPT + SUGGEST_REPLIES_ANSWER_RULES);
    expect(calls[0].prompt).toBe("CEFR: B1\nctx");
  });

  it("con draft sigue parseando de forma lenient", async () => {
    const { llm } = fakeLlm('["Sure.","I can help with that.","Absolutely."]');
    const out = await suggestReplies({ llm, context: "ctx", level: "B1", draft: "borrador" });
    expect(out.map((s) => s.text)).toEqual(["Sure.", "I can help with that.", "Absolutely."]);
  });
});

describe("suggestReplies — foco de la unidad del libro (scenarioType)", () => {
  it("sin scenarioType no cambia el prompt (retrocompatible)", async () => {
    const { llm, calls } = fakeLlm("[]");
    await suggestReplies({ llm, context: "ctx", level: "B1" });
    expect(calls[0].prompt).toBe("CEFR: B1\nctx");
  });

  it("con scenarioType conocido, añade chunks de la unidad y frases del banco al prompt", async () => {
    const { llm, calls } = fakeLlm("[]");
    await suggestReplies({ llm, context: "ctx", level: "A1", scenarioType: "daily_standup" });
    // Unidad 4 (A1, daily_standup): chunk de su lista.
    expect(calls[0].prompt).toContain("What are you working on?");
    // Banco de frases G.1 (standup), primeras 4 en orden del apéndice.
    expect(calls[0].prompt).toContain("I picked up X.");
  });

  it("con scenarioType sin unidad/situación asociada no rompe (igual que sin scenarioType)", async () => {
    const { llm, calls } = fakeLlm("[]");
    await suggestReplies({ llm, context: "ctx", level: "B1", scenarioType: "no_existe" });
    expect(calls[0].prompt).toBe("CEFR: B1\nctx");
  });
});

describe("suggestReplies — anti-eco del agente (BUG-001)", () => {
  const context =
    'EMMA role: Scrum Master. Last message: "Could you tell me more about the specific progress and the next steps?"';

  it("descarta sugerencias que son eco de la pregunta del agente", async () => {
    const { llm } = fakeLlm(
      '["What is the progress?","Yesterday I finished the login API and opened the PR.","Can you tell me more about the next steps?"]',
    );
    const out = await suggestReplies({ llm, context, level: "B1" });
    expect(out.map((s) => s.text)).toEqual([
      "Yesterday I finished the login API and opened the PR.",
    ]);
  });

  it("el system exige respuestas del APRENDIZ en primera persona, no preguntas del agente", async () => {
    const { llm, calls } = fakeLlm('["Ok."]');
    await suggestReplies({ llm, context, level: "B1" });
    expect(calls[0].system).toContain(SUGGEST_REPLIES_SYSTEM_PROMPT);
    expect(calls[0].system).toMatch(/LEARNER's side/);
    expect(calls[0].system).toMatch(/never echo/i);
  });
});
