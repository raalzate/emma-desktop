import { describe, expect, it } from "vitest";
import { observeTurn } from "../observe-turn-use-case";
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
});
