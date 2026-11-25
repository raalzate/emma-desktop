/**
 * El tope de reloj del turno cancela la generación (incidente 2026-11-24): el
 * motor local procesa una a la vez y una generación vencida que sigue
 * corriendo deja al reintento esperando detrás — «se queda pensando».
 */

import { describe, it, expect, vi } from "vitest";
import { runChatTurn } from "../run-chat-turn-use-case";
import type { LlmGenerate } from "@/domain/ai/llm-port";

const base = {
  system: "system",
  history: [
    { role: "assistant" as const, content: "The merge failed this morning." },
    { role: "user" as const, content: "Oh no, what happened?" },
  ],
  userMessage: "Can we fix it before the demo?",
};

describe("runChatTurn: tope de reloj", () => {
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

  it("cada llamada lleva su etiqueta de traza", async () => {
    const tags: (string | undefined)[] = [];
    const llm: LlmGenerate = async (a) => {
      tags.push(a.tag);
      return tags.length === 1 ? "As an AI language model, no." : "Yes, the rollback is ready.";
    };
    await runChatTurn({ ...base, llm });
    expect(tags).toEqual(["chat", "chat-retry"]);
  });
});
