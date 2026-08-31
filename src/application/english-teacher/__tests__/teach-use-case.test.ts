import { describe, it, expect } from "vitest";
import { teach, type TeachArgs } from "../teach-use-case";
import type { LlmGenerate, LlmGenerateArgs } from "@/domain/ai/llm-port";

/**
 * Fake del puerto LlmGenerate: ramifica por el prefijo del prompt de cada sección
 * (fonética = "Frases:", gramática = "Text:", respuestas = "Emma said:").
 */
function makeFakeLlm(): { llm: LlmGenerate; calls: LlmGenerateArgs[] } {
  const calls: LlmGenerateArgs[] = [];
  const llm: LlmGenerate = async (args) => {
    calls.push(args);
    if (args.prompt.startsWith("Frases:")) {
      return "hello there | jelou der | hola ahí";
    }
    if (args.prompt.startsWith("Text:")) {
      return "STRUCTURE: Greeting\nPATTERN: Hi\nEXAMPLE: hello\nWHY: es un saludo";
    }
    return "REPLY: Hi there :: casual\nREPLY: Hello :: neutral\nREPLY: Good day :: formal";
  };
  return { llm, calls };
}

const args = (over: Partial<TeachArgs>): TeachArgs => ({
  llm: makeFakeLlm().llm,
  text: "Hello there friend.",
  responseId: "r1",
  userId: 1,
  ...over,
});

describe("teach — validación de entrada", () => {
  it("rechaza texto vacío", async () => {
    await expect(teach(args({ text: "" }))).rejects.toThrow("text must not be empty");
  });

  it("rechaza userId no positivo", async () => {
    await expect(teach(args({ userId: 0 }))).rejects.toThrow(
      "user_id must be a positive integer",
    );
  });
});

describe("teach — camino feliz", () => {
  it("ensambla un resultado exitoso con las tres secciones", async () => {
    const { llm } = makeFakeLlm();
    const res = await teach(args({ llm, text: "Please close the door now." }));
    expect(res.status).toBe("success");
    expect(res.errorCode).toBeNull();
    expect(res.cached).toBe(false);
    expect(res.sections.phonetics).toHaveLength(1);
    expect(res.sections.grammar[0].label).toBe("Greeting");
    expect(res.replySuggestions).toEqual(["Hi there", "Hello", "Good day"]);
    expect(res.teachingText).toContain("Pronunciation");
    expect(res.teachingText).toContain("Grammar");
    expect(res.teachingText).toContain("Reply suggestions");
  });

  it("propaga el maxTokens correcto a cada llamada de sección", async () => {
    const { llm, calls } = makeFakeLlm();
    await teach(args({ llm, text: "Kindly verify the migration today." }));
    const budgets = calls.map((c) => c.maxTokens);
    expect(budgets).toEqual([460, 360, 220]); // fonética, gramática, respuestas
  });

  it("omite la sección de fonética cuando el texto no tiene frases con letras", async () => {
    const { llm, calls } = makeFakeLlm();
    const res = await teach(args({ llm, text: "12345" }));
    expect(res.status).toBe("success");
    expect(res.sections.phonetics).toEqual([]);
    // sin frases → nunca se llama al prompt de fonética
    expect(calls.some((c) => c.prompt.startsWith("Frases:"))).toBe(false);
    expect(calls).toHaveLength(2); // solo gramática y respuestas
  });

  it("usa 'en' como idioma de explicación por defecto", async () => {
    const { llm } = makeFakeLlm();
    const res = await teach(args({ llm, text: "Default language check here." }));
    expect(res.explainLanguage).toBe("en");
  });

  it("emite el Markdown acumulado a onProgress una vez por sección", async () => {
    const { llm } = makeFakeLlm();
    const snapshots: string[] = [];
    await teach(
      args({
        llm,
        text: "Report the status of the build.",
        onProgress: (md) => {
          snapshots.push(md);
        },
      }),
    );
    expect(snapshots).toHaveLength(3);
    expect(snapshots[0]).toContain("Pronunciation");
    expect(snapshots[2]).toContain("Reply suggestions");
  });
});

describe("teach — caché", () => {
  it("devuelve resultado cacheado y no vuelve a llamar al LLM", async () => {
    const first = makeFakeLlm();
    const text = "A unique cached sentence for teaching.";
    const res1 = await teach(args({ llm: first.llm, text }));
    expect(res1.cached).toBe(false);
    const before = first.calls.length;

    const second = makeFakeLlm();
    const res2 = await teach(args({ llm: second.llm, text }));
    expect(res2.cached).toBe(true);
    expect(second.calls).toHaveLength(0); // el segundo LLM nunca se invoca
    expect(first.calls).toHaveLength(before); // ni el primero de nuevo
  });
});

describe("teach — camino de error", () => {
  it("devuelve errorResult cuando una sección del LLM falla", async () => {
    const failing: LlmGenerate = async () => {
      throw new Error("boom");
    };
    const res = await teach(args({ llm: failing, text: "This call will fail badly." }));
    expect(res.status).toBe("error");
    expect(res.errorCode).toBe("TEACHING_SERVICE_UNAVAILABLE");
    expect(res.teachingText).toBe("");
    expect(res.replySuggestions).toEqual([]);
    expect(res.cached).toBe(false);
  });

  it("no cachea los resultados de error", async () => {
    const text = "This failing text must not be cached.";
    const failing: LlmGenerate = async () => {
      throw new Error("boom");
    };
    const res1 = await teach(args({ llm: failing, text }));
    expect(res1.status).toBe("error");

    // Un segundo intento con un LLM sano debe re-ejecutar y tener éxito.
    const { llm } = makeFakeLlm();
    const res2 = await teach(args({ llm, text }));
    expect(res2.status).toBe("success");
    expect(res2.cached).toBe(false);
  });
});
