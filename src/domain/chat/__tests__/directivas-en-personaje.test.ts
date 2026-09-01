/**
 * Las directivas se le dan a una PERSONA, no a un asistente.
 *
 * El incidente: `ELABORATE_CUE` decía «ask ONE specific follow-up for a concrete
 * detail about that same thing» y el modelo devolvió, literalmente, «I'd like to
 * know more about the specific technical challenge you are facing». La directiva
 * de profundizar produjo «I understand the context, but I'd like to know more
 * about the specific "issue" you mentioned in your previous response».
 *
 * Un modelo pequeño devuelve el vocabulario que le das. Si describís el ACTO DE
 * HABLA en jerga de asistente, habla como un asistente. En la misma traza, los
 * turnos que salieron naturales fueron los de `sceneDirective`, que dice «react
 * to what they just said… then ask about X» y trae la escena, no el proceso.
 *
 * Regla que fija esta prueba: ninguna directiva usa vocabulario de meta-diálogo
 * («follow-up», «response», «answer» como sustantivo, «I'd like to know»), y las
 * que piden profundizar traen un EJEMPLO de línea hablada (mostrar > prohibir,
 * igual que STYLE_EXAMPLE en el prompt de sistema).
 */

import { describe, expect, it } from "vitest";
import { advanceScene, createSceneState, sceneDirective } from "../scene-state";
import { buildTurnDirective } from "../turn-directive";
import { buildElaborationCue } from "../elaboration";
import { GREETING_CUE, REPAIR_CUE } from "../learner-intent";
import { WRAP_UP_CUE } from "../scene-closing";

/** Jerga de asistente: describe el acto de habla en vez de la escena. */
const JERGA_DE_ASISTENTE =
  /\bfollow-?up\b|\byour (?:previous )?(?:response|answer|reply)\b|\bi'?d like to know\b|\bthe user\b|\bprompt\b/i;

function standup() {
  const state = createSceneState("daily_standup");
  if (!state) throw new Error("daily_standup debe tener checklist");
  return state;
}

function cubierto() {
  let s = standup();
  s = advanceScene(s, "yesterday i finished the retry logic.");
  s = advanceScene(s, "today i plan to run the load test.");
  return advanceScene(s, "i am blocked waiting on the DBA.");
}

const TODAS_LAS_DIRECTIVAS = (): [string, string][] => [
  ["elaboración", buildElaborationCue()],
  ["reparación", REPAIR_CUE],
  ["saludo", GREETING_CUE],
  ["cierre", WRAP_UP_CUE],
  ["siguiente tema", sceneDirective(advanceScene(standup(), "yesterday i merged the PR."))],
  ["profundizar", sceneDirective(cubierto(), { deepen: true })],
];

describe("ninguna directiva habla como un asistente", () => {
  for (const [nombre, cue] of TODAS_LAS_DIRECTIVAS()) {
    it(`la directiva de ${nombre} no usa jerga de meta-diálogo`, () => {
      expect(cue, cue).not.toMatch(JERGA_DE_ASISTENTE);
    });
  }
});

describe("las directivas difíciles muestran, no sólo prohíben", () => {
  it("la de elaboración trae un ejemplo de línea hablada", () => {
    expect(buildElaborationCue()).toMatch(/like\s+"/i);
  });

  it("la de profundizar trae un ejemplo de línea hablada", () => {
    expect(sceneDirective(cubierto(), { deepen: true })).toMatch(/like\s+"/i);
  });

  it("la de reparación trae un ejemplo de línea hablada", () => {
    expect(REPAIR_CUE).toMatch(/like\s+"/i);
  });
});

describe("el turno completo hereda la voz de personaje", () => {
  it("una elaboración armada por buildTurnDirective sigue sin jerga", () => {
    const d = buildTurnDirective({
      state: advanceScene(standup(), "yesterday i merged the PR."),
      elaborate: true,
      deepen: false,
      wrapUp: false,
      recastCue: "",
    });
    expect(d, d).not.toMatch(JERGA_DE_ASISTENTE);
  });
});
