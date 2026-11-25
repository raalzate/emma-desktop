/**
 * No perder el hilo (contrato vigente desde #323, T7).
 *
 * Historia: tras dos generaciones vetadas la escena caía en una línea amnésica
 * («Sorry, I lost my train of thought…»); el arreglo agregó un tercer intento
 * con contexto recortado y una recuperación que retomaba «la pregunta
 * abierta». Medido en vivo (incidente 2026-11-24), esa recuperación
 * RE-PREGUNTABA lo que el aprendiz acababa de contestar («Sorry, let me put it
 * another way — what did you do yesterday?»), y el tercer intento costaba otra
 * generación entera. Contrato nuevo: 1 generación + 1 reintento; si ambos
 * fallan, una continuación neutral que acusa recibo y devuelve el turno.
 */

import { describe, it, expect } from "vitest";
import { runChatTurn } from "../run-chat-turn-use-case";
import type { LlmGenerate } from "@/domain/ai/llm-port";

const HISTORIA = [
  { role: "assistant" as const, content: "Okay, thanks for waiting. What did you work on yesterday?" },
  { role: "user" as const, content: "Yesterday I wrapped up the user profile update task." },
  { role: "assistant" as const, content: "Great, I'm glad to hear that! What is your plan for today?" },
  { role: "user" as const, content: "I plan to finish the API integration by noon." },
  { role: "assistant" as const, content: "Great, that sounds good! Are you blocked on anything?" },
];

describe("no perder el hilo", () => {
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
  });

  it("tras dos generaciones inválidas NO hay tercer intento", async () => {
    let calls = 0;
    const llm: LlmGenerate = async () => {
      calls++;
      return "As an AI language model, I cannot answer that.";
    };
    await runChatTurn({ llm, system: "system", history: HISTORIA, userMessage: "No, I'm not blocked." });
    expect(calls).toBe(2);
  });

  it("si ambas fallan: continuación neutral, sin re-preguntar ni declarar amnesia", async () => {
    const llm: LlmGenerate = async () => "As an AI language model, I cannot help with that.";
    const reply = await runChatTurn({
      llm,
      system: "system",
      history: HISTORIA,
      userMessage: "No, I'm not blocked.",
    });
    expect(reply).not.toMatch(/train of thought|where were we|put it another way/i);
    expect(reply.toLowerCase()).not.toContain("blocked on anything");
    expect(reply).not.toBe(HISTORIA[HISTORIA.length - 1].content);
    expect(reply.length).toBeGreaterThan(5);
  });
});
