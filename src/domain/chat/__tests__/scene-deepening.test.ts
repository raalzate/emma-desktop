/**
 * Dos ajustes de naturalidad de la escena:
 *  - la directiva pide reaccionar a lo dicho ANTES de preguntar (evita el
 *    "What is the plan for today?" seco, sin acuse de recibo);
 *  - con el checklist cubierto pero la sesión aún sin turnos suficientes para
 *    evaluarse, la escena profundiza en lo ya contado en vez de cerrar — cerrar
 *    antes del mínimo dejaba la sesión sin nota de progresión.
 */

import { describe, expect, it } from "vitest";
import { advanceScene, createSceneState, sceneDirective } from "@/domain/chat/scene-state";
import { resolveSceneClose } from "@/domain/chat/scene-closing";

function standup() {
  const state = createSceneState("daily_standup");
  if (!state) throw new Error("daily_standup debe tener checklist");
  return state;
}

function fullyCovered() {
  let state = standup();
  for (const line of [
    "yesterday i finished the retry logic.",
    "today i plan to run the load test.",
    "i am blocked waiting on the DBA.",
  ]) {
    state = advanceScene(state, line);
  }
  return state;
}

describe("sceneDirective — reaccionar antes de preguntar", () => {
  it("pide acusar recibo de lo dicho antes de la siguiente pregunta", () => {
    const state = advanceScene(standup(), "yesterday i finished the retry logic.");
    const directive = sceneDirective(state).toLowerCase();
    expect(directive).toMatch(/react to|acknowledge/);
    expect(directive).toContain("then ask");
  });

  it("sigue nombrando el ítem exacto que toca preguntar", () => {
    const state = advanceScene(standup(), "yesterday i finished the retry logic.");
    expect(sceneDirective(state)).toContain("their plan for TODAY");
  });

  it("cierra la escena cuando ya no queda nada pendiente", () => {
    expect(sceneDirective(fullyCovered()).toLowerCase()).toContain("close the scene");
  });

  it("con `deepen` profundiza en lo contado en vez de cerrar", () => {
    const directive = sceneDirective(fullyCovered(), { deepen: true });
    expect(directive.toLowerCase()).toContain("do not close");
    expect(directive.toLowerCase()).toMatch(/follow-up|more detail/);
    // Se apoya en un hecho ya dado por el aprendiz.
    expect(directive).toContain("DBA");
  });
});

describe("resolveSceneClose — no cerrar antes de poder evaluar", () => {
  const base = {
    checklistComplete: true,
    turn: 3,
    maxTurns: 8,
    lastReply: "Great, thanks for the update!",
    graceTurnsUsed: 0,
  };

  it("no cierra con el checklist cubierto si faltan turnos para la nota", () => {
    expect(resolveSceneClose({ ...base, minTurns: 5 })).toEqual({
      close: false,
      grantGrace: false,
      deepen: true,
    });
  });

  it("cierra en cuanto se alcanza el mínimo evaluable", () => {
    expect(resolveSceneClose({ ...base, turn: 5, minTurns: 5 })).toEqual({
      close: true,
      grantGrace: false,
      deepen: false,
    });
  });

  it("sin mínimo declarado mantiene el comportamiento anterior", () => {
    expect(resolveSceneClose(base)).toEqual({ close: true, grantGrace: false, deepen: false });
  });

  it("el presupuesto agotado cierra aunque no se alcance el mínimo", () => {
    expect(
      resolveSceneClose({ ...base, checklistComplete: false, turn: 8, minTurns: 5 }),
    ).toEqual({ close: true, grantGrace: false, deepen: false });
  });
});
