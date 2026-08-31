import { describe, it, expect, vi, afterEach } from "vitest";
import { runChatTurn } from "../run-chat-turn-use-case";
import type { LlmGenerate } from "@/domain/ai/llm-port";

const FALLBACK = "EMMA is having trouble responding right now. Please try again.";

afterEach(() => {
  vi.useRealTimers();
});

describe("runChatTurn", () => {
  it("recorta una respuesta larga a un tope de 3 oraciones", async () => {
    const fakeLlm: LlmGenerate = async () =>
      "Sure, let's practice ordering coffee. What size would you like? I recommend the medium. It has the best value. Enjoy your drink!";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
    });
    expect(reply).toBe(
      "Sure, let's practice ordering coffee. What size would you like? I recommend the medium.",
    );
  });

  it("elimina meta-monólogo del modelo antes de responder", async () => {
    const fakeLlm: LlmGenerate = async () =>
      "My interpretation of the situation: you want to order coffee. 1. (Current State) 2. (Goal) Sure, let's continue the roleplay.";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
    });
    expect(reply).toBe("Sure, let's continue the roleplay.");
  });

  it("deja intacta una respuesta corta sin meta-texto", async () => {
    const fakeLlm: LlmGenerate = async () => "Hi! How can I help you today?";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
    });
    expect(reply).toBe("Hi! How can I help you today?");
  });

  it("preserva la pregunta final aunque quede fuera del tope de oraciones", async () => {
    const fakeLlm: LlmGenerate = async () =>
      "Uno. Dos. Tres. ¿Cuatro te parece bien? Cinco.";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
    });
    expect(reply).toBe("Uno. Dos. ¿Cuatro te parece bien?");
  });

  it("si la respuesta es 100% meta-monólogo responde con la recuperación EN PERSONAJE (no el fallback técnico)", async () => {
    const fakeLlm: LlmGenerate = async () =>
      "My interpretation of the situation: none. 1. (Current State) 2. (Goal) (Final Answer)";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
    });
    expect(reply).not.toBe(FALLBACK);
    expect(reply).not.toMatch(/EMMA/);
    expect(reply.length).toBeGreaterThan(10);
  });

  it("reintenta UNA vez con nudge correctivo cuando la primera generación es basura", async () => {
    let calls = 0;
    const fakeLlm: LlmGenerate = async (a) => {
      calls++;
      if (calls === 1) return "As an AI, I cannot answer that.";
      expect(a.prompt).toMatch(/rejected/i);
      return "No blockers then?";
    };
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
    });
    expect(calls).toBe(2);
    expect(reply).toBe("No blockers then?");
  });

  it("una respuesta idéntica al turno anterior de la persona dispara el reintento", async () => {
    let calls = 0;
    const fakeLlm: LlmGenerate = async () => {
      calls++;
      return calls === 1
        ? "What is the next step?"
        : "Got it — and is anything blocking you?";
    };
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [
        { role: "assistant", content: "What is the next step?" },
        { role: "user", content: "I will check the ticket now." },
      ],
      userMessage: "Done, ticket checked.",
    });
    expect(calls).toBe(2);
    expect(reply).toBe("Got it — and is anything blocking you?");
  });

  it("nunca repite la línea de recuperación dos turnos seguidos", async () => {
    const fakeLlm: LlmGenerate = async () => "As an AI, I cannot answer that.";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [
        {
          role: "assistant",
          content: "Sorry, I lost my train of thought for a second — where were we?",
        },
        { role: "user", content: "We were talking about the new project." },
      ],
      userMessage: "We were talking about the new project.",
    });
    expect(reply).not.toBe("Sorry, I lost my train of thought for a second — where were we?");
    expect(reply).not.toBe(FALLBACK);
    expect(reply.length).toBeGreaterThan(10);
  });

  it("veta con validateReply (re-pregunta de ítem cubierto) y reintenta", async () => {
    let calls = 0;
    const fakeLlm: LlmGenerate = async () => {
      calls++;
      return calls === 1 ? "So we need to know what the next step is!" : "Anything blocking you?";
    };
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [
        { role: "assistant", content: "What did you do yesterday?" },
        { role: "user", content: "I finished the report for Project Alpha." },
      ],
      userMessage: "I need to finish the report by Friday.",
      validateReply: (r) => !/next step/i.test(r),
    });
    expect(calls).toBe(2);
    expect(reply).toBe("Anything blocking you?");
  });

  it("colapsa el smalltalk viejo del historial en una nota (capas de contexto)", async () => {
    let seen = "";
    const fakeLlm: LlmGenerate = async (a) => {
      seen = a.prompt;
      return "Ok.";
    };
    await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [
        { role: "assistant", content: "Good morning! what's up?" },
        { role: "user", content: "I am fine, thank you. How are you?" },
        { role: "assistant", content: "I'm doing well, thank you!" },
        { role: "user", content: "I finished the report for Project Alpha." },
        { role: "assistant", content: "Great, what's next?" },
        { role: "user", content: "I need to finish the report by Friday." },
        { role: "assistant", content: "Got it — anything blocking you?" },
        { role: "user", content: "No blockers at all." },
      ],
      userMessage: "Anything else you need from me?",
    });
    expect(seen).toMatch(/small talk/i);
    expect(seen).not.toContain("I am fine, thank you. How are you?");
    expect(seen).toContain("I finished the report for Project Alpha.");
  });

  it("no repite el opener del turno anterior de la persona", async () => {
    const fakeLlm: LlmGenerate = async () =>
      "Great, so far so good! What is the next step for the release?";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [
        { role: "assistant", content: "Great, so far so good! What task are you on?" },
        { role: "user", content: "I need to update the user manual by Friday." },
      ],
      userMessage: "I need to check the data first.",
    });
    expect(reply).toBe("What is the next step for the release?");
  });

  it("aplica el mismo recorte a lo parcial emitido cuando el LLM se pasa del timeout", async () => {
    vi.useFakeTimers();
    const fakeLlm: LlmGenerate = (args) => {
      args.onToken?.("Uno. Dos. Tres. Cuatro. Cinco.");
      return new Promise(() => {}); // nunca resuelve: fuerza el timeout
    };
    const promise = runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
    });
    await vi.advanceTimersByTimeAsync(60_000);
    const reply = await promise;
    expect(reply).toBe("Uno. Dos. Tres.");
  });

  it("devuelve el FALLBACK si el timeout llega sin tokens emitidos", async () => {
    vi.useFakeTimers();
    const fakeLlm: LlmGenerate = () => new Promise(() => {});
    const promise = runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
    });
    await vi.advanceTimersByTimeAsync(60_000);
    const reply = await promise;
    expect(reply).toBe(FALLBACK);
  });

  it("reconstruye el contexto completo en el prompt de cada turno (sin memoria del motor)", async () => {
    let seen: { sessionId?: string; turnMessage?: string; prompt?: string } = {};
    const fakeLlm: LlmGenerate = async (args) => {
      seen = { sessionId: args.sessionId, turnMessage: args.turnMessage, prompt: args.prompt };
      return "Ok.";
    };
    await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [{ role: "assistant", content: "Hi Raul! What did you do yesterday?" }],
      userMessage: "I worked on the report.",
      sessionId: "chat-42",
    });
    expect(seen.sessionId).toBe("chat-42");
    // Ya no hay envío incremental: el turno viaja dentro del prompt completo.
    expect(seen.turnMessage).toBeUndefined();
    expect(seen.prompt).toContain("CONVERSATION SO FAR");
    expect(seen.prompt).toContain("You: Hi Raul! What did you do yesterday?");
    expect(seen.prompt).toContain("NEW MESSAGE from the learner:\nI worked on the report.");
    expect(seen.prompt).toMatch(/never repeat a greeting/i);
    expect(seen.prompt).toMatch(/never re-ask/i);
  });
});

describe("runChatTurn — BUG-001", () => {
  it("inserta el ancla de personaje junto a la instrucción final del prompt", async () => {
    let seen: { prompt?: string } = {};
    const fakeLlm: LlmGenerate = async (args) => {
      seen = { prompt: args.prompt };
      return "Ok.";
    };
    await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [{ role: "assistant", content: "Hi!" }],
      userMessage: "hello",
      sessionId: "chat-1",
      characterAnchor: "[stay in character as Sofía Torres, Scrum Master]",
    });
    expect(seen.prompt).toContain("[stay in character as Sofía Torres, Scrum Master]");
    // El ancla va al final (punto de generación), después del historial.
    const prompt = seen.prompt ?? "";
    expect(prompt.indexOf("stay in character")).toBeGreaterThan(
      prompt.indexOf("CONVERSATION SO FAR"),
    );
  });

  it("elimina el resaludo cuando la persona ya había abierto la escena", async () => {
    const fakeLlm: LlmGenerate = async () =>
      "Hello! I'm ready to hear about your progress. What is blocking you today?";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [
        { role: "assistant", content: "Hey Raul, what did you do yesterday?" },
        { role: "user", content: "Good morning! I worked on the report." },
      ],
      userMessage: "I worked on the report.",
    });
    expect(reply).toBe("I'm ready to hear about your progress. What is blocking you today?");
  });

  it("conserva el saludo del kickoff (primer turno de la persona)", async () => {
    const fakeLlm: LlmGenerate = async () => "Hey Raul, good morning! Ready for standup?";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "[scene cue] begin",
    });
    expect(reply).toBe("Hey Raul, good morning! Ready for standup?");
  });

  it("elimina la fuga de identidad de IA y conserva el resto en personaje", async () => {
    const fakeLlm: LlmGenerate = async () =>
      "As a large language model, I need a bit more information. Anyway, what did you finish yesterday?";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
    });
    expect(reply).toBe("Anyway, what did you finish yesterday?");
  });

  it("si TODA la respuesta era fuga de identidad responde con la línea de recuperación en personaje", async () => {
    const fakeLlm: LlmGenerate = async () =>
      "As an AI, I do not have enough information to answer that.";
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
    });
    expect(reply).not.toBe(FALLBACK);
    expect(reply).not.toMatch(/\b(AI|language model)\b/i);
    expect(reply.length).toBeGreaterThan(10);
  });
});

describe("runChatTurn — compuerta de streaming (BUG-001)", () => {
  it("no reenvía al stream una apertura con fuga de identidad", async () => {
    let streamed = "";
    const fakeLlm: LlmGenerate = async (args) => {
      args.onToken?.("As a large language model, I need more information. ");
      args.onToken?.("Anyway, what did you finish yesterday?");
      return "As a large language model, I need more information. Anyway, what did you finish yesterday?";
    };
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
      onToken: (c) => (streamed += c),
    });
    expect(streamed).toBe("");
    expect(reply).toBe("Anyway, what did you finish yesterday?");
  });

  it("suprime el stream cuando la apertura trae escritura no latina", async () => {
    let streamed = "";
    const thai = "ถ้าคุณต้องการให้ฉันช่วยในฐานะผู้ช่วย ถ้าคุณต้องการให้ฉันช่วยในฐานะผู้ช่วย. ";
    const fakeLlm: LlmGenerate = async (args) => {
      args.onToken?.(thai);
      return `${thai}Ok, let's continue.`;
    };
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
      onToken: (c) => (streamed += c),
    });
    expect(streamed).toBe("");
    expect(reply).toBe("Ok, let's continue.");
  });

  it("reenvía el stream normal cuando la apertura es segura", async () => {
    let streamed = "";
    const fakeLlm: LlmGenerate = async (args) => {
      args.onToken?.("Morning! ");
      args.onToken?.("What did you work on yesterday?");
      return "Morning! What did you work on yesterday?";
    };
    const reply = await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [],
      userMessage: "hi",
      onToken: (c) => (streamed += c),
    });
    expect(streamed).toBe("Morning! What did you work on yesterday?");
    expect(reply).toBe("Morning! What did you work on yesterday?");
  });
});

describe("runChatTurn — guion de escena por turno (BUG-001)", () => {
  it("inserta el beat del guion en la instrucción final del prompt", async () => {
    let seen: { prompt?: string } = {};
    const fakeLlm: LlmGenerate = async (args) => {
      seen = { prompt: args.prompt };
      return "Ok.";
    };
    await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [{ role: "assistant", content: "What did you do yesterday?" }],
      userMessage: "I finished the report.",
      sceneCue: "React to their yesterday update, then ask for TODAY's plan.",
    });
    expect(seen.prompt).toContain("SCENE SCRIPT — React to their yesterday update");
  });

  it("sin sceneCue el prompt no lleva bloque de guion", async () => {
    let seen: { prompt?: string } = {};
    const fakeLlm: LlmGenerate = async (args) => {
      seen = { prompt: args.prompt };
      return "Ok.";
    };
    await runChatTurn({
      llm: fakeLlm,
      system: "system",
      history: [{ role: "assistant", content: "Hi!" }],
      userMessage: "hello",
    });
    expect(seen.prompt).not.toContain("SCENE SCRIPT");
  });
});
