/**
 * Caso de uso del chat de apoyo (#357, T8).
 */
import { describe, expect, it, vi } from "vitest";
import { askTutor, TUTOR_FALLBACK } from "../ask-tutor-use-case";
import type { LlmGenerate } from "@/domain/ai/llm-port";

describe("askTutor", () => {
  it("pregunta al modelo con su tag y devuelve la respuesta limpia", async () => {
    const llm = vi.fn<LlmGenerate>(async () => '  "Deploy" se dice desplegar. Example: We deploy on Fridays.  ');
    const out = await askTutor({ llm, question: "¿Qué es deploy?", level: "A1", history: [] });
    expect(out).toBe('"Deploy" se dice desplegar. Example: We deploy on Fridays.');
    expect(llm.mock.calls[0][0]).toMatchObject({ tag: "tutor-chat" });
  });

  it("una pregunta inválida no llama al modelo", async () => {
    const llm = vi.fn<LlmGenerate>(async () => "x");
    expect(await askTutor({ llm, question: "   ", level: "A1", history: [] })).toBeNull();
    expect(llm).not.toHaveBeenCalled();
  });

  it("si el modelo falla o responde vacío, una disculpa amable (nunca un error técnico)", async () => {
    const fails: LlmGenerate = async () => {
      throw new Error("engine");
    };
    expect(await askTutor({ llm: fails, question: "hi", level: "A1", history: [] })).toBe(TUTOR_FALLBACK);
    expect(await askTutor({ llm: async () => "   ", question: "hi", level: "A1", history: [] })).toBe(TUTOR_FALLBACK);
  });
});
