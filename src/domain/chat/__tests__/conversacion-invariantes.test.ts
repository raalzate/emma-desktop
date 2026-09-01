/**
 * Invariantes de la CONVERSACIÓN completa, validados determinísticamente.
 *
 * El "why": cinco incidentes seguidos («la escena repregunta lo contestado»,
 * «se cuelga al cerrar», «profundiza sobre la nada») pasaron con el gate verde,
 * porque las unitarias prueban piezas con el LLM mockeado y nadie jugaba la
 * conversación entera. Este simulador recorre el MISMO camino que un turno real
 * — observación (en modo red determinista), cobertura, directiva, veto — y
 * afirma lo que ninguna pieza puede afirmar sola:
 *
 *   I1. Una respuesta al tema preguntado NUNCA se pierde.
 *   I2. La directiva NUNCA vuelve a pedir un tema ya cubierto.
 *   I3. La directiva de profundizar NUNCA cita una negación ni queda vacía.
 *   I4. El veto NUNCA rechaza lo que la directiva acaba de ordenar.
 *
 * Corre sobre un corpus de fraseos reales (incluidos los que rompieron la app,
 * verbatim de las capturas). Cuando el juez LLM esté disponible sólo puede
 * MEJORAR sobre esto: aquí se fija el piso que la red garantiza sola.
 */

import { describe, expect, it } from "vitest";
import {
  coverItem,
  createSceneState,
  deepeningTarget,
  isReaskingCovered,
  sceneProgress,
  type SceneState,
} from "../scene-state";
import { fallbackObservation } from "../turn-observation";
import { buildTurnDirective } from "../turn-directive";
import { turnsToGradeFor, maxTurnsFor } from "../simulation-session";

/** Un turno como lo ejecuta la sesión real, con el juez en modo red. */
function jugarTurno(state: SceneState, lastAgentLine: string, message: string) {
  const obs = fallbackObservation({ message, state, lastAgentLine });
  let next = state;
  if (obs.intent === "in-scene" && obs.answersItem) {
    next = coverItem(state, obs.answersItem, message, { negative: obs.negative });
  }
  const complete = next.pending.length === 0;
  const deepen = complete;
  const directive = buildTurnDirective({
    state: next,
    intent: obs.intent,
    elaborate: false,
    deepen,
    wrapUp: false,
    recastCue: "",
  });
  return { obs, state: next, directive, deepen };
}

/** La pregunta "canónica" que la persona haría por cada ítem del standup. */
const PREGUNTA: Record<string, string> = {
  yesterday: "What did you do yesterday?",
  today: "What are you working on today?",
  blockers: "Are you blocked on anything for today?",
};

function standup(): SceneState {
  const s = createSceneState("daily_standup");
  if (!s) throw new Error("daily_standup debe tener checklist");
  return s;
}

/**
 * Corpus adversario de "no tengo bloqueos": cada fraseo que ya rompió la app
 * en producción (capturas) más variaciones plausibles. Si un fraseo nuevo
 * rompe la escena, se AÑADE aquí y el arreglo queda fijado para siempre.
 */
const NEGACIONES_DE_BLOQUEO = [
  "Nothing",
  "no",
  "Not",
  "Nathing for now", // captura 2026-09-01 (falta de ortografía real)
  "No, I am fine for now.", // captura 2026-09-01
  "No, I am fine today.", // captura 2026-09-01 (rompió DESPUÉS del primer arreglo)
  "No, everything is good.",
  "Nothing for now",
  "no, all good",
  "Not really.",
  "nope, all clear today",
];

describe("I1 — una respuesta al tema preguntado nunca se pierde", () => {
  for (const respuesta of NEGACIONES_DE_BLOQUEO) {
    it(`«${respuesta}» cubre bloqueos cuando eso fue lo preguntado`, () => {
      let s = standup();
      s = jugarTurno(s, PREGUNTA.yesterday, "Yesterday I finished the login page.").state;
      s = jugarTurno(s, PREGUNTA.today, "Today I will start the profile page.").state;
      const { state } = jugarTurno(s, PREGUNTA.blockers, respuesta);
      expect(state.pending, respuesta).toHaveLength(0);
      expect(sceneProgress(state)).toEqual({ done: 3, total: 3 });
    });
  }

  it("las respuestas con contenido cubren su tema aunque lleguen fuera de orden", () => {
    let s = standup();
    s = jugarTurno(s, PREGUNTA.yesterday, "I am blocked waiting on the security review.").state;
    s = jugarTurno(s, PREGUNTA.yesterday, "Yesterday I wrapped up the migration script.").state;
    s = jugarTurno(s, PREGUNTA.today, "Today I plan to start the backfill.").state;
    expect(s.pending).toHaveLength(0);
  });
});

describe("I2 — la directiva nunca vuelve a pedir un tema cubierto", () => {
  it("en la conversación literal de la captura (2026-09-01, 13:25)", () => {
    let s = standup();
    const turnos: [string, string][] = [
      [PREGUNTA.yesterday, "Yesterday I finished the login page."],
      [PREGUNTA.today, "I'm going to start the user settings module now."],
      [PREGUNTA.blockers, "No, I am fine today."],
    ];
    for (const [pregunta, respuesta] of turnos) {
      const r = jugarTurno(s, pregunta, respuesta);
      s = r.state;
      // La directiva del turno no puede nombrar como PENDIENTE nada ya cubierto.
      for (const c of s.covered) {
        expect(r.directive, `directiva repide «${c.id}»`).not.toContain(`ask ONLY about ${c.ask}`);
      }
    }
    // Tras contestar bloqueos, la escena está completa: no queda nada que repedir.
    expect(s.pending).toHaveLength(0);
  });
});

describe("I3 — profundizar nunca cita una negación ni queda vacío", () => {
  for (const respuesta of NEGACIONES_DE_BLOQUEO) {
    it(`tras «${respuesta}» la directiva de profundizar es cumplible`, () => {
      let s = standup();
      s = jugarTurno(s, PREGUNTA.yesterday, "Yesterday I finished the login page.").state;
      s = jugarTurno(s, PREGUNTA.today, "Today I will start the profile page.").state;
      const { directive } = jugarTurno(s, PREGUNTA.blockers, respuesta);
      // La negación puede aparecer en «You already know» (para no repreguntar),
      // pero JAMÁS como el hecho sobre el que se pide más detalle.
      expect(directive, respuesta).not.toContain(`told you: "${respuesta}"`);
      expect(directive).not.toMatch(/told you: ""/);
    });
  }
});

describe("I4 — el veto nunca rechaza lo que la directiva ordenó", () => {
  it("profundizar sobre el ítem elegido pasa el veto, con CUALQUIER negación del corpus", () => {
    for (const respuesta of NEGACIONES_DE_BLOQUEO) {
      let s = standup();
      s = jugarTurno(s, PREGUNTA.yesterday, "Yesterday I finished the login page.").state;
      s = jugarTurno(s, PREGUNTA.today, "Today I will start the profile page.").state;
      s = jugarTurno(s, PREGUNTA.blockers, respuesta).state;
      const target = deepeningTarget(s);
      expect(target, `sin objetivo de profundización tras «${respuesta}»`).not.toBeNull();
      // Una pregunta razonable sobre el objetivo elegido no puede ser vetada.
      const pregunta = `How is the ${target!.id === "today" ? "profile page" : "login page"} going today?`;
      expect(
        isReaskingCovered(pregunta, s, { deepeningOn: target!.id }),
        `veto contradice la orden tras «${respuesta}»`,
      ).toBe(false);
    }
  });
});

describe("presupuesto y nota siguen siendo coherentes con el guion", () => {
  it("el standup se puede completar y calificar dentro de su presupuesto", () => {
    expect(turnsToGradeFor("daily_standup")).toBeLessThanOrEqual(maxTurnsFor("daily_standup"));
  });
});
