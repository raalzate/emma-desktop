import { describe, it, expect, vi } from "vitest";
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

  // Contrato cambiado (incidente 2026-11-24, «pierde el hilo»): el juez del
  // modelo pequeño da falsos positivos (8/8 líneas buenas rechazadas como
  // wrong-role medido en vivo). Dos vetos del juez escalaban a la reformulación
  // con contexto recortado y a la recuperación «Sorry, let me put it another
  // way», que re-pregunta lo ya contestado. El juez es señal BLANDA: compra un
  // reintento, nunca tumba un segundo intento que pasó la limpieza.
  it("tras un rechazo del juez, el segundo intento limpio se acepta sin juzgar ni reformular", async () => {
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
    expect(prompts).toHaveLength(2);
    // El segundo intento no se juzga: su veredicto ya no cambiaría nada y
    // costaba otra generación en el motor local.
    expect(judged).toEqual(["Bad line one."]);
    expect(reply).toBe("Bad line two.");
  });

  it("el juez nunca lleva el turno a la recuperación si hubo una línea limpia", async () => {
    const { llm } = scripted(["Good morning, Raul! What did you work on yesterday?"]);
    const reply = await runChatTurn({
      ...base,
      llm,
      judgeReply: async () => ({ inScene: false, issue: "wrong-role" }),
    });
    expect(reply).not.toMatch(/put it another way/i);
    // El resaludo lo quita la guardia de saludo: la persona ya abrió la escena.
    expect(reply).toBe("What did you work on yesterday?");
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

describe("runChatTurn: el tope de reloj cancela la generación", () => {
  // Incidente 2026-11-24: una generación vencida seguía ocupando el motor local
  // (una a la vez) y el reintento esperaba detrás — «se queda pensando».
  it("al vencer el tope aborta la generación pendiente", async () => {
    vi.useFakeTimers();
    try {
      const signals: (AbortSignal | undefined)[] = [];
      const llm: LlmGenerate = (a) => {
        signals.push(a.signal);
        return new Promise<string>(() => {});
      };
      const pending = runChatTurn({ ...base, llm });
      await vi.advanceTimersByTimeAsync(60_001);
      await pending;
      expect(signals[0]?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
