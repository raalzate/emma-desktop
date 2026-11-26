import { describe, expect, it, vi } from "vitest";
import { observeTurn, quickObservation } from "../observe-turn-use-case";
import { createSceneState } from "@/domain/chat/scene-state";
import type { LlmGenerate } from "@/domain/ai/llm-port";

function standup() {
  const s = createSceneState("daily_standup");
  if (!s) throw new Error("daily_standup debe tener checklist");
  return s;
}

const base = {
  state: standup(),
  lastAgentLine: "Are you blocked on anything for today?",
  message: "No, I am fine today.",
  level: "A1" as const,
};

describe("observeTurn — LLM juzga, código decide", () => {
  it("usa la clasificación del modelo cuando pasa la guarda (el caso que rompió la escena)", async () => {
    const llm: LlmGenerate = async () =>
      '{"answers":"blockers","negative":true,"kind":"scene","substance":"none"}';
    const obs = await observeTurn({ llm, ...base });
    expect(obs).toEqual({
      answersItem: "blockers",
      negative: true,
      intent: "in-scene",
      substance: "none",
      coherence: "clear",
      source: "judge",
    });
  });

  it("cae a las heurísticas si el modelo devuelve basura", async () => {
    const llm: LlmGenerate = async () => "I cannot help with that.";
    const obs = await observeTurn({ llm, ...base, message: "Yesterday I finished the login page." });
    // La red reproduce el comportamiento previo: atribución por señales.
    expect(obs.answersItem).toBe("yesterday");
  });

  it("cae a las heurísticas si el modelo se cuelga (nunca bloquea el turno)", async () => {
    const llm: LlmGenerate = () => new Promise(() => {});
    const obs = await observeTurn({ llm, ...base, timeoutMs: 30 });
    // Statu quo del regex: «No, I am fine today.» no se reconoce — por eso el
    // juez primario es el modelo; la red sólo garantiza no empeorar.
    expect(obs.intent).toBe("in-scene");
  });

  // Un observador vencido que sigue generando tapa la cola del motor local y
  // la respuesta de la persona espera detrás (incidente 2026-11-24).
  it("al vencer el presupuesto aborta la generación del observador", async () => {
    let signal: AbortSignal | undefined;
    const llm: LlmGenerate = (a) => {
      signal = a.signal;
      return new Promise<string>(() => {});
    };
    await observeTurn({ llm, ...base, timeoutMs: 30 });
    expect(signal?.aborted).toBe(true);
  });

  it("cae a las heurísticas si la llamada lanza", async () => {
    const llm: LlmGenerate = async () => {
      throw new Error("engine busy");
    };
    const obs = await observeTurn({ llm, ...base, message: "What does 'blocker' mean?" });
    expect(obs.intent).toBe("meta");
  });

  it("sin checklist no llama al modelo: no hay nada que atribuir", async () => {
    let llamadas = 0;
    const llm: LlmGenerate = async () => {
      llamadas += 1;
      return "{}";
    };
    const obs = await observeTurn({ llm, ...base, state: null });
    expect(llamadas).toBe(0);
    expect(obs.answersItem).toBeNull();
  });

  it("pasa a través el veredicto de coherencia del modelo (H3)", async () => {
    const llm: LlmGenerate = async () =>
      '{"answers":"none","negative":false,"kind":"scene","substance":"thin","coherence":"unclear"}';
    const obs = await observeTurn({ llm, ...base });
    expect(obs.coherence).toBe("unclear");
  });

  it("degrada a clear si el turno anterior ya pidió aclaración (no dos veces seguidas, FR-004)", async () => {
    const llm: LlmGenerate = async () =>
      '{"answers":"none","negative":false,"kind":"scene","substance":"thin","coherence":"unclear"}';
    const obs = await observeTurn({ llm, ...base, previousWasClarifying: true });
    expect(obs.coherence).toBe("clear");
  });

  it("la red heurística nunca acusa: timeout, error o basura del modelo caen a coherence clear", async () => {
    const timeoutObs = await observeTurn({
      llm: () => new Promise(() => {}),
      ...base,
      timeoutMs: 30,
    });
    expect(timeoutObs.coherence).toBe("clear");

    const garbageObs = await observeTurn({
      llm: async () => "I cannot help with that.",
      ...base,
    });
    expect(garbageObs.coherence).toBe("clear");

    const throwingObs = await observeTurn({
      llm: async () => {
        throw new Error("engine busy");
      },
      ...base,
    });
    expect(throwingObs.coherence).toBe("clear");
  });
});

describe("atajo cuando la red está segura (SC-002 de #323)", () => {
  // El juez cuesta ~2,7 s en el camino crítico de cada turno. Cuando la red
  // determinista ya atribuyó el mensaje a un tema pendiente con contenido, o
  // reconoce un saludo, el modelo no agrega nada: se ahorra la llamada.
  it("con atribución segura no llama al modelo", async () => {
    const llm = vi.fn<LlmGenerate>(async () => "{}");
    const obs = await observeTurn({ llm, ...base, message: "Yesterday I finished the login page and the tests." });
    expect(llm).not.toHaveBeenCalled();
    expect(obs).toMatchObject({ answersItem: "yesterday", intent: "in-scene", source: "fast-path" });
  });

  it("un saludo reconocido tampoco paga la llamada", async () => {
    const llm = vi.fn<LlmGenerate>(async () => "{}");
    const obs = await observeTurn({ llm, ...base, message: "Hi Sofia, good morning!" });
    expect(llm).not.toHaveBeenCalled();
    expect(obs.intent).toBe("greeting");
  });

  it("si la red duda (la negativa que rompió la escena), decide el modelo", async () => {
    const llm = vi.fn<LlmGenerate>(async () => '{"answers":"blockers","negative":true,"kind":"scene","substance":"none"}');
    const obs = await observeTurn({ llm, ...base, message: "No, I am fine today." });
    expect(llm).toHaveBeenCalledTimes(1);
    expect(obs.source).toBe("judge");
  });
});

describe("quickObservation — la red sin modelo, para responder sin esperar al juez", () => {
  it("no llama al modelo y aplica la rúbrica de coherencia", () => {
    const state = createSceneState("daily_standup");
    const obs = quickObservation({
      state,
      lastAgentLine: "What did you work on yesterday?",
      message: "Hello!",
      level: "A1",
      previousWasClarifying: true,
    });
    expect(obs.intent).toBe("greeting");
    expect(obs.coherence).not.toBe("unclear");
    expect(["fast-path", "heuristics"]).toContain(obs.source);
  });
});
