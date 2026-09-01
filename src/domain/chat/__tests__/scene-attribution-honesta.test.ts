/**
 * La escena no adivina qué contestó el aprendiz.
 *
 * El incidente (observado en la app, escena daily_standup):
 *
 *   T2 «I will start the registration form today.»  → today   (markers SÍ)  ✓
 *   T3 «Nathing for now»                            → yesterday (índice 0)  ✗
 *   T4 «I spent most of yesterday on the login API» → blockers  (índice 0)  ✗
 *
 * Al cuarto turno el estado afirmaba `yesterday: "Nathing for now"` y
 * `blockers: "I spent most of yesterday on the login API"`, y esa invención
 * viajaba al prompt bajo el encabezado «You already know —». El modelo recibía
 * una versión falsa de su propia conversación y respondía en consecuencia.
 *
 * La regla nueva: un mensaje cubre un ítem sólo si SUS señales lo dicen, o si es
 * el ítem que la persona acaba de preguntar. Sin evidencia no se cubre nada —
 * que la escena avance un turno de más es infinitamente más barato que mentirle
 * al modelo sobre lo que se dijo.
 */

import { describe, expect, it } from "vitest";
import { advanceScene, createSceneState, type SceneState } from "../scene-state";

function standup(): SceneState {
  const state = createSceneState("daily_standup");
  if (!state) throw new Error("daily_standup debe tener checklist");
  return state;
}

const idsCubiertos = (s: SceneState) => s.covered.map((c) => c.id);
const hechoDe = (s: SceneState, id: string) => s.covered.find((c) => c.id === id)?.fact;

describe("advanceScene — sólo cubre lo que el mensaje de verdad contesta", () => {
  it("cubre el ítem cuyas señales matchean, aunque no sea el primero de la cola", () => {
    const s = advanceScene(standup(), "I will start the registration form today.");
    expect(idsCubiertos(s)).toEqual(["today"]);
  });

  it("NO cubre nada cuando ninguna señal matchea y no se preguntó nada", () => {
    const s = advanceScene(standup(), "Nathing for now");
    expect(idsCubiertos(s)).toEqual([]);
    expect(s.pending).toHaveLength(3);
  });

  it("cubre el ítem que la persona ACABA de preguntar, aunque falten señales", () => {
    const s = advanceScene(standup(), "Nathing for now", {
      lastAgentLine: "Do you have any blockers for that?",
    });
    expect(idsCubiertos(s)).toEqual(["blockers"]);
    expect(hechoDe(s, "blockers")).toBe("Nathing for now");
  });

  it("las señales del mensaje mandan sobre lo que se preguntó", () => {
    const s = advanceScene(standup(), "Yesterday I finished the login page.", {
      lastAgentLine: "Do you have any blockers for that?",
    });
    expect(idsCubiertos(s)).toEqual(["yesterday"]);
  });

  it("no reasigna a un ítem ya cubierto: la pregunta vieja no vuelve a contar", () => {
    let s = advanceScene(standup(), "Yesterday I finished the login page.");
    s = advanceScene(s, "some vague remark", {
      lastAgentLine: "What did you do yesterday?",
    });
    expect(idsCubiertos(s)).toEqual(["yesterday"]);
    expect(hechoDe(s, "yesterday")).toBe("Yesterday I finished the login page.");
  });

  it("la traza completa del incidente ya no inventa hechos", () => {
    let s = standup();
    s = advanceScene(s, "Yesterday I finished the login page.", {
      lastAgentLine: "What did you do yesterday?",
    });
    s = advanceScene(s, "I will start the registration form today.", {
      lastAgentLine: "What are you working on today?",
    });
    s = advanceScene(s, "Nathing for now", {
      lastAgentLine: "Do you have any blockers for that?",
    });
    expect(idsCubiertos(s).sort()).toEqual(["blockers", "today", "yesterday"]);
    expect(hechoDe(s, "yesterday")).toBe("Yesterday I finished the login page.");
    expect(hechoDe(s, "blockers")).toBe("Nathing for now");
  });

  it("el relleno sin contenido sigue sin cubrir nada aunque se acabe de preguntar", () => {
    const s = advanceScene(standup(), "ok", { lastAgentLine: "What did you do yesterday?" });
    expect(idsCubiertos(s)).toEqual([]);
  });
});
