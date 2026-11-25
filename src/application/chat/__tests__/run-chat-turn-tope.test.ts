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

describe("runChatTurn: no repetir la propia pregunta (T13 de #323)", () => {
  const history = [
    { role: "assistant" as const, content: "Nice, which part of the login page took you the longest?" },
    { role: "user" as const, content: "Today I will write tests." },
  ];

  it("una línea que repite la pregunta anterior pierde esa pregunta y conserva la reacción", async () => {
    const replies = [
      "Tests are good. Nice, which part of the login page took you the longest?",
      "Tests are good. Which tests are you starting with?",
    ];
    const llm: LlmGenerate = async () => replies.shift() ?? "";
    const reply = await runChatTurn({ system: "s", history, userMessage: "Today I will write tests.", llm });
    expect(reply).toBe("Tests are good.");
  });

  it("si sólo era la pregunta repetida, entra el reintento", async () => {
    const replies = ["Nice, which part of the login page took you the longest?", "Which tests are you starting with?"];
    const llm: LlmGenerate = async () => replies.shift() ?? "";
    const reply = await runChatTurn({ system: "s", history, userMessage: "Today I will write tests.", llm });
    expect(reply).toBe("Which tests are you starting with?");
  });

  it("en reparación (allowRestate) repetir la propia pregunta ES la orden", async () => {
    const llm: LlmGenerate = async () => "I mean — which part of the login page took you the longest?";
    const reply = await runChatTurn({ system: "s", history, userMessage: "What do you mean?", llm, allowRestate: true });
    expect(reply).toContain("took you the longest?");
  });
});

describe("runChatTurn: re-preguntar sólo es falta si el aprendiz contestó (T13 de #323)", () => {
  const opening = { role: "assistant" as const, content: "Hi Raul, thanks for joining. What did you do yesterday?" };

  it("si el aprendiz no contestó («Hi.»), repetir la pregunta abierta es correcto", async () => {
    const llm: LlmGenerate = async () => "Hi again! So, what did you do yesterday?";
    const reply = await runChatTurn({ system: "s", history: [opening], userMessage: "Hi.", llm });
    expect(reply).toContain("what did you do yesterday?");
  });

  it("si contestó, la pregunta repetida se quita y queda la reacción, en una sola llamada", async () => {
    let calls = 0;
    const llm: LlmGenerate = async () => {
      calls++;
      return "Nice work on the login. What did you do yesterday?";
    };
    const reply = await runChatTurn({
      system: "s",
      history: [opening],
      userMessage: "Yesterday I finished the login page.",
      llm,
    });
    expect(reply).toBe("Nice work on the login.");
    expect(calls).toBe(1);
  });
});
