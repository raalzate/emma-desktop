import { describe, expect, it } from "vitest";
import {
  buildObservationPrompt,
  fallbackObservation,
  parseObservation,
  resolveCoherence,
} from "../turn-observation";
import { advanceScene, createSceneState } from "../scene-state";

const pendientes = [
  { id: "yesterday", ask: "what they worked on YESTERDAY" },
  { id: "blockers", ask: "whether anything is BLOCKING them" },
];

describe("buildObservationPrompt", () => {
  const prompt = buildObservationPrompt({
    lastAgentLine: "Are you blocked on anything for today?",
    message: "No, I am fine today.",
    pending: pendientes,
    level: "A1",
  });

  it("lleva la pregunta de la persona, el mensaje y los temas abiertos", () => {
    expect(prompt).toContain("Are you blocked on anything for today?");
    expect(prompt).toContain("No, I am fine today.");
    expect(prompt).toContain("blockers");
    expect(prompt).toContain("yesterday");
  });

  it("pide SOLO JSON y ajusta la vara de sustancia al nivel", () => {
    expect(prompt).toMatch(/ONLY JSON/i);
    expect(prompt).toContain("A1");
  });

  it("pide la rúbrica de coherencia: entendible, responde a lo preguntado, pertenece a la escena", () => {
    expect(prompt).toContain("coherence");
    expect(prompt).toMatch(/clear.*unclear.*off-topic|clear\|unclear\|off-topic/i);
  });
});

describe("parseObservation — guarda de borde sobre lo que devuelve el modelo", () => {
  const ids = ["yesterday", "blockers"];

  it("acepta la clasificación válida (el caso que rompió la escena)", () => {
    const obs = parseObservation(
      '{"answers":"blockers","negative":true,"kind":"scene","substance":"none"}',
      ids,
    );
    expect(obs).toEqual({
      answersItem: "blockers",
      negative: true,
      intent: "in-scene",
      substance: "none",
      source: "judge",
      // Sin campo "coherence" en la respuesta del modelo: nunca se acusa por
      // defecto (FR-004).
      coherence: "clear",
    });
  });

  it("acepta coherence del modelo cuando el mensaje es de escena (in-scene)", () => {
    const unclear = parseObservation(
      '{"answers":"none","negative":false,"kind":"scene","substance":"none","coherence":"unclear"}',
      ids,
    );
    expect(unclear?.coherence).toBe("unclear");

    const offTopic = parseObservation(
      '{"answers":"none","negative":false,"kind":"scene","substance":"thin","coherence":"off-topic"}',
      ids,
    );
    expect(offTopic?.coherence).toBe("off-topic");
  });

  it("un coherence inventado por el modelo cae a clear (FR-004: ante la duda, nunca se acusa)", () => {
    const obs = parseObservation(
      '{"answers":"none","negative":false,"kind":"scene","substance":"none","coherence":"confused"}',
      ids,
    );
    expect(obs?.coherence).toBe("clear");
  });

  it("saludo o meta siempre es coherence clear, aunque el modelo derive: son andamiaje, no contenido a juzgar", () => {
    const greeting = parseObservation(
      '{"answers":"none","negative":false,"kind":"greeting","substance":"none","coherence":"off-topic"}',
      ids,
    );
    expect(greeting?.coherence).toBe("clear");

    const meta = parseObservation(
      '{"answers":"none","negative":false,"kind":"help","substance":"none","coherence":"unclear"}',
      ids,
    );
    expect(meta?.coherence).toBe("clear");
  });

  it("tolera texto alrededor del JSON (modelo pequeño)", () => {
    const obs = parseObservation(
      'Sure! Here is the label:\n{"answers":"none","negative":false,"kind":"help","substance":"none"} hope it helps',
      ids,
    );
    expect(obs?.intent).toBe("meta");
    expect(obs?.answersItem).toBeNull();
  });

  it("un ítem inventado por el modelo se descarta, no se cubre", () => {
    const obs = parseObservation(
      '{"answers":"sprint_goals","negative":false,"kind":"scene","substance":"full"}',
      ids,
    );
    expect(obs?.answersItem).toBeNull();
  });

  it("basura ⇒ null: el caller decide el fallback", () => {
    expect(parseObservation("I could not classify that.", ids)).toBeNull();
    expect(parseObservation('{"answers":42}', ids)).toBeNull();
    expect(parseObservation("", ids)).toBeNull();
  });

  it("un kind desconocido no rompe: cae a escena (lo menos disruptivo)", () => {
    const obs = parseObservation(
      '{"answers":"none","negative":false,"kind":"party","substance":"full"}',
      ids,
    );
    expect(obs?.intent).toBe("in-scene");
  });
});

describe("fallbackObservation — las heurísticas viejas, ahora como red", () => {
  function standup() {
    const s = createSceneState("daily_standup");
    if (!s) throw new Error("daily_standup debe tener checklist");
    return s;
  }

  it("atribuye por señales del mensaje como antes", () => {
    const obs = fallbackObservation({
      message: "Yesterday I finished the login page.",
      state: standup(),
      lastAgentLine: "What did you do yesterday?",
    });
    expect(obs.answersItem).toBe("yesterday");
    expect(obs.intent).toBe("in-scene");
  });

  it("una negación escueta anclada a la pregunta sigue contando", () => {
    let s = standup();
    s = advanceScene(s, "Yesterday I finished the login page.");
    s = advanceScene(s, "Today I will start the profile page.");
    const obs = fallbackObservation({
      message: "Nothing",
      state: s,
      lastAgentLine: "Anything blocking you?",
    });
    expect(obs.answersItem).toBe("blockers");
    expect(obs.negative).toBe(true);
  });

  it("una duda de idioma sigue siendo meta", () => {
    const obs = fallbackObservation({
      message: "What does 'blocker' mean?",
      state: standup(),
      lastAgentLine: "Anything blocking you?",
    });
    expect(obs.intent).toBe("meta");
    expect(obs.answersItem).toBeNull();
  });

  it("la red nunca acusa de incoherente: coherence siempre clear (FR-004)", () => {
    const obs = fallbackObservation({
      message: "asdkjf random gibberish about spaceships",
      state: standup(),
      lastAgentLine: "What did you do yesterday?",
    });
    expect(obs.coherence).toBe("clear");
  });
});

describe("resolveCoherence — no pedir aclaración dos turnos seguidos", () => {
  it("degrada unclear a clear si el turno anterior ya pidió aclaración", () => {
    expect(resolveCoherence("unclear", true)).toBe("clear");
  });

  it("deja unclear si el turno anterior NO pidió aclaración", () => {
    expect(resolveCoherence("unclear", false)).toBe("unclear");
  });

  it("off-topic y clear no se ven afectados por el turno anterior", () => {
    expect(resolveCoherence("off-topic", true)).toBe("off-topic");
    expect(resolveCoherence("clear", true)).toBe("clear");
  });
});
