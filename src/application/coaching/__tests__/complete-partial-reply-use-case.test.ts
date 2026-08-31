import { describe, it, expect } from "vitest";
import type { LlmGenerate, LlmGenerateArgs } from "@/domain/ai/llm-port";
import { COMPLETE_PARTIAL_REPLY_SYSTEM_PROMPT } from "@/domain/coaching/reply-suggestion";
import { completePartialReply } from "../complete-partial-reply-use-case";

/** LLM falso que devuelve un texto fijo y captura los args recibidos. */
function fakeLlm(reply: string): { llm: LlmGenerate; calls: LlmGenerateArgs[] } {
  const calls: LlmGenerateArgs[] = [];
  const llm: LlmGenerate = async (args) => {
    calls.push(args);
    return reply;
  };
  return { llm, calls };
}

describe("completePartialReply", () => {
  it("devuelve solo la continuación cuando la propuesta empieza por el parcial", async () => {
    const { llm } = fakeLlm('["I would like to schedule a meeting."]');
    const out = await completePartialReply({ llm, context: "ctx", partial: "I would like" });
    expect(out).toBe(" to schedule a meeting.");
  });

  it("recorta el espacio inicial del parcial antes de comparar el prefijo", async () => {
    const { llm } = fakeLlm('["Hello there team"]');
    const out = await completePartialReply({ llm, context: "ctx", partial: "  Hello" });
    expect(out).toBe(" there team"); // prefix "Hello" (len 5) recortado de la propuesta
  });

  it("compara el prefijo sin distinguir mayúsculas/minúsculas", async () => {
    const { llm } = fakeLlm('["hello team"]');
    const out = await completePartialReply({ llm, context: "ctx", partial: "Hello" });
    expect(out).toBe(" team");
  });

  it("devuelve la frase entera si la propuesta no empieza por el parcial", async () => {
    const { llm } = fakeLlm('["Let me check that for you."]');
    const out = await completePartialReply({ llm, context: "ctx", partial: "I would" });
    expect(out).toBe("Let me check that for you.");
  });

  it("usa la primera propuesta no vacía de la lista", async () => {
    const { llm } = fakeLlm('["","  ","Good idea."]');
    const out = await completePartialReply({ llm, context: "ctx", partial: "" });
    expect(out).toBe("Good idea.");
  });

  it("solo considera las primeras 3 propuestas al buscar la válida", async () => {
    // Las 3 primeras son inválidas -> ignora la 4ª válida -> "".
    const { llm } = fakeLlm('["","","","Cuarta valida"]');
    const out = await completePartialReply({ llm, context: "ctx", partial: "" });
    expect(out).toBe("");
  });

  it("devuelve '' cuando el LLM no produce un array usable", async () => {
    const { llm } = fakeLlm("no puedo ayudar");
    const out = await completePartialReply({ llm, context: "ctx", partial: "Hola" });
    expect(out).toBe("");
  });

  it("pasa el system prompt, el prompt de dominio y 180 tokens al LLM", async () => {
    const { llm, calls } = fakeLlm("[]");
    await completePartialReply({ llm, context: "el contexto", partial: "escribiendo" });
    expect(calls).toHaveLength(1);
    expect(calls[0].system).toBe(COMPLETE_PARTIAL_REPLY_SYSTEM_PROMPT);
    expect(calls[0].prompt).toBe("el contexto\nLearner is typing: escribiendo");
    expect(calls[0].maxTokens).toBe(180);
  });

  it("propaga el error si el puerto LLM lanza", async () => {
    const failing: LlmGenerate = async () => {
      throw new Error("boom");
    };
    await expect(
      completePartialReply({ llm: failing, context: "ctx", partial: "Hi" }),
    ).rejects.toThrow("boom");
  });
});
