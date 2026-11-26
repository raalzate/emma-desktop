import { describe, expect, it } from "vitest";
import { applyLateObservation } from "../late-observation";
import type { SceneState } from "../scene-state";
import type { TurnObservation } from "../turn-observation";

const estado: SceneState = {
  scenarioType: "daily_standup",
  covered: [],
  pending: [
    { id: "yesterday", ask: "what they worked on YESTERDAY" },
    { id: "blockers", ask: "whether anything is BLOCKING them" },
  ],
} as unknown as SceneState;

const juez = (o: Partial<TurnObservation>): TurnObservation => ({
  answersItem: null,
  negative: false,
  intent: "in-scene",
  substance: "full",
  coherence: "clear",
  source: "judge",
  ...o,
});

describe("applyLateObservation: el juez corre después de responder y corrige el estado", () => {
  it("cubre el tema que el juez detectó y la red no", () => {
    const s = applyLateObservation(estado, juez({ answersItem: "blockers", negative: true }), "Nope, all good");
    expect(s?.pending.map((i) => i.id)).toEqual(["yesterday"]);
    expect(s?.covered).toEqual([expect.objectContaining({ id: "blockers", fact: "Nope, all good", negative: true })]);
  });

  it("no toca el estado si el tema ya estaba cubierto", () => {
    const cubierto = applyLateObservation(estado, juez({ answersItem: "blockers" }), "x");
    expect(applyLateObservation(cubierto, juez({ answersItem: "blockers" }), "y")).toBe(cubierto);
  });

  it("no cubre nada si el mensaje no era de la escena o no contestaba un tema", () => {
    expect(applyLateObservation(estado, juez({ intent: "meta", answersItem: "blockers" }), "x")).toBe(estado);
    expect(applyLateObservation(estado, juez({ answersItem: null }), "x")).toBe(estado);
  });

  it("sin estado de escena no hay nada que corregir", () => {
    expect(applyLateObservation(null, juez({ answersItem: "blockers" }), "x")).toBeNull();
  });
});
