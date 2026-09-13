/**
 * BUG (síntoma observado): tras dos generaciones vetadas la escena caía en la
 * línea amnésica «Sorry, I lost my train of thought…» y el hilo de la
 * conversación se perdía, aunque la app TENÍA el historial completo.
 *
 * Arreglo en dos frenos:
 *  1. `allowRestate` (turno de reparación): repetir lo propio en palabras más
 *     simples es la ORDEN del turno, así que los guardias anti-repetición no
 *     pueden vetarlo — vetaban las dos generaciones y de ahí la amnesia.
 *  2. Tercer intento FOCALIZADO: consulta selectiva del contexto (memoria de
 *     escena + últimos turnos) pidiendo reformular; solo si eso también falla
 *     se recurre a una recuperación anclada al hilo (la pregunta abierta).
 */

import { describe, it, expect } from "vitest";
import { runChatTurn } from "../run-chat-turn-use-case";
import type { LlmGenerate } from "@/domain/ai/llm-port";

const AMNESIA = "Sorry, I lost my train of thought for a second — where were we?";

const HISTORIA = [
  { role: "assistant" as const, content: "Okay, thanks for waiting. What did you work on yesterday?" },
  { role: "user" as const, content: "Yesterday I wrapped up the user profile update task." },
  { role: "assistant" as const, content: "Great, I'm glad to hear that! What is your plan for today?" },
  { role: "user" as const, content: "I plan to finish the API integration by noon." },
  { role: "assistant" as const, content: "Great, that sounds good! Are you blocked on anything?" },
];

describe("no perder el hilo tras un pedido de aclaración", () => {
  it("con allowRestate la reformulación de la propia línea NO se veta", async () => {
    const llm: LlmGenerate = async () =>
      "Great, that sounds good! I mean — is anything stopping you right now?";
    const reply = await runChatTurn({
      llm,
      system: "system",
      history: HISTORIA,
      userMessage: "Could you explain it to me better?",
      allowRestate: true,
    });
    expect(reply).toContain("is anything stopping you right now?");
    expect(reply).not.toBe(AMNESIA);
  });

  it("tras dos vetos hace un TERCER intento focalizado antes de rendirse", async () => {
    const prompts: string[] = [];
    let calls = 0;
    const llm: LlmGenerate = async ({ prompt }) => {
      prompts.push(prompt);
      calls++;
      // Las dos primeras generaciones son basura (fuga de identidad): vetadas.
      if (calls <= 2) return "As an AI language model, I cannot answer that.";
      return "Let me put it another way: is anything slowing the integration down?";
    };
    const reply = await runChatTurn({
      llm,
      system: "system",
      history: HISTORIA,
      userMessage: "Could you explain it to me better?",
    });
    expect(calls).toBe(3);
    expect(reply).toBe("Let me put it another way: is anything slowing the integration down?");
    // El tercer prompt es una consulta SELECTIVA: más corto que el completo y
    // con la línea que hay que reformular.
    expect(prompts[2].length).toBeLessThan(prompts[0].length);
    expect(prompts[2]).toContain("Are you blocked on anything?");
  });

  it("si todo falla la recuperación retoma la pregunta abierta, no la amnesia", async () => {
    const llm: LlmGenerate = async () => "As an AI language model, I cannot help with that.";
    const reply = await runChatTurn({
      llm,
      system: "system",
      history: HISTORIA,
      userMessage: "Could you explain it to me better?",
    });
    expect(reply).not.toBe(AMNESIA);
    expect(reply.toLowerCase()).toContain("blocked on anything");
  });
});
