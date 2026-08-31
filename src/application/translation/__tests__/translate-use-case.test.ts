import { describe, it, expect } from "vitest";
import type { LlmGenerate, LlmGenerateArgs } from "@/domain/ai/llm-port";
import { TRANSLATION_MAX_TOKENS } from "@/domain/shared/token-budgets";
import { SYSTEM_PROMPT } from "@/domain/translation/translation-prompt";
import { translate } from "../translate-use-case";

describe("translate", () => {
  it("devuelve pares bilingües a partir de la salida del LLM", async () => {
    const fakeLlm: LlmGenerate = async () => "Hello\nHola\n\nBye\nAdiós";
    const res = await translate({ llm: fakeLlm, text: "Hello\nBye", targetLang: "es" });
    expect(res.pairs).toEqual([
      { source: "Hello", target: "Hola" },
      { source: "Bye", target: "Adiós" },
    ]);
  });

  it("resuelve el código de idioma a su nombre en inglés para el prompt", async () => {
    let captured: LlmGenerateArgs | undefined;
    const fakeLlm: LlmGenerate = async (args) => {
      captured = args;
      return "";
    };
    await translate({ llm: fakeLlm, text: "Hi", targetLang: "de" });
    expect(captured?.prompt).toBe("Translate to German:\nHi");
  });

  it("pasa un nombre de idioma desconocido tal cual al prompt", async () => {
    let captured: LlmGenerateArgs | undefined;
    const fakeLlm: LlmGenerate = async (args) => {
      captured = args;
      return "";
    };
    // "Klingon" no está en el catálogo: se usa verbatim (fallback passthrough).
    await translate({ llm: fakeLlm, text: "Hi", targetLang: "Klingon" });
    expect(captured?.prompt).toBe("Translate to Klingon:\nHi");
  });

  it("envía el system prompt de dominio y el presupuesto de tokens", async () => {
    let captured: LlmGenerateArgs | undefined;
    const fakeLlm: LlmGenerate = async (args) => {
      captured = args;
      return "";
    };
    await translate({ llm: fakeLlm, text: "Hi", targetLang: "es" });
    expect(captured?.system).toBe(SYSTEM_PROMPT);
    expect(captured?.maxTokens).toBe(TRANSLATION_MAX_TOKENS);
  });

  it("devuelve pares vacíos cuando la salida del LLM está vacía", async () => {
    const fakeLlm: LlmGenerate = async () => "";
    const res = await translate({ llm: fakeLlm, text: "Hi", targetLang: "es" });
    expect(res.pairs).toEqual([]);
  });

  it("devuelve pares vacíos en vez de lanzar cuando el LLM falla", async () => {
    const failing: LlmGenerate = async () => {
      throw new Error("boom");
    };
    const res = await translate({ llm: failing, text: "Hi", targetLang: "es" });
    expect(res.pairs).toEqual([]);
  });
});
