/**
 * El paso Verify no puede vetar lo que el paso Decide acaba de ordenar.
 *
 * El incidente (captura del usuario, daily_standup, «Temas 3/3 · 4/5»):
 *
 *   Sofía: Are there any blockers for you today?
 *   Raúl:  No, I am fine for now.
 *   Sofía: Great, that's good to hear! Is there anything blocking you or any other issues?
 *   Raúl:  no
 *   Sofía: Sorry, I lost my train of thought for a second — where were we?
 *
 * Dos defectos encadenados, los dos del bucle agéntico y no del modelo:
 *
 * 1. «No, I am fine for now.» no era ni sustantivo (una sola palabra de
 *    contenido) ni negación cerrada (el detector exigía que la negación fuera
 *    TODO el mensaje). Se perdía, el objetivo seguía pendiente y la persona
 *    repreguntaba lo que el aprendiz acababa de contestar.
 *
 * 2. Con el checklist completo, `deepen` ordena profundizar sobre un ítem YA
 *    CUBIERTO, y `isReaskingCovered` veta justamente las preguntas sobre ítems
 *    cubiertos. Decide y Verify se contradicen: las dos generaciones caían y la
 *    escena terminaba en la línea de recuperación.
 *
 * La regla: Verify recibe lo que Decide ordenó, en vez de re-deducirlo.
 */

import { describe, expect, it } from "vitest";
import {
  advanceScene,
  createSceneState,
  isClosedNegative,
  isReaskingCovered,
  type SceneState,
} from "../scene-state";

function standup(): SceneState {
  const s = createSceneState("daily_standup");
  if (!s) throw new Error("daily_standup debe tener checklist");
  return s;
}

describe("isClosedNegative — una negación con coletilla sigue siendo una negación", () => {
  it("reconoce la forma que rompió la escena", () => {
    expect(isClosedNegative("No, I am fine for now.")).toBe(true);
  });

  it("reconoce otras formas corteses de decir que no", () => {
    for (const m of [
      "No, everything is good.",
      "no, all good right now",
      "Not really, I am fine.",
      "No, nothing much.",
    ]) {
      expect(isClosedNegative(m), m).toBe(true);
    }
  });

  it("sigue sin tragarse una negación que SÍ trae contenido", () => {
    expect(isClosedNegative("no, i am blocked by the DBA approval")).toBe(false);
    expect(isClosedNegative("No, I could not finish the migration script.")).toBe(false);
  });

  it("no confunde una afirmación con una negación", () => {
    expect(isClosedNegative("I finished the migration")).toBe(false);
    expect(isClosedNegative("yeah, ok sure")).toBe(false);
  });
});

describe("advanceScene — una negación cortés contesta el objetivo", () => {
  it("cubre bloqueos con «No, I am fine for now.»", () => {
    let s = standup();
    s = advanceScene(s, "Yesterday I finished the login page.");
    s = advanceScene(s, "Today I will start the profile page.");
    s = advanceScene(s, "No, I am fine for now.", {
      lastAgentLine: "Are there any blockers for you today?",
    });
    expect(s.covered.map((c) => c.id)).toContain("blockers");
    expect(s.pending).toHaveLength(0);
  });
});

describe("isReaskingCovered — el veto respeta lo que Decide ordenó", () => {
  function cubierto(): SceneState {
    let s = standup();
    s = advanceScene(s, "Yesterday I finished the login page.");
    s = advanceScene(s, "Today I will start the profile page.");
    return advanceScene(s, "No, I am fine for now.", {
      lastAgentLine: "Are there any blockers for you today?",
    });
  }

  it("no veta la profundización sobre el ítem que Decide eligió", () => {
    const s = cubierto();
    expect(
      isReaskingCovered("What is left on the profile page today?", s, { deepeningOn: "today" }),
    ).toBe(false);
  });

  it("sigue vetando una re-pregunta de OTRO ítem ya cubierto", () => {
    const s = cubierto();
    expect(
      isReaskingCovered("So, is anything blocking you?", s, { deepeningOn: "today" }),
    ).toBe(true);
  });

  it("sin profundización declarada mantiene el veto de siempre", () => {
    const s = cubierto();
    expect(isReaskingCovered("What is left on the profile page today?", s)).toBe(true);
  });
});
