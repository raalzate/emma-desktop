import { describe, expect, it } from "vitest";
import {
  buildObservationPrompt,
  fallbackObservation,
  parseObservation,
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
    });
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
});
