/**
 * Una negación breve ("Not", "No", "Nothing") ES una respuesta al objetivo.
 *
 * El defecto: el filtro de sustantividad exige ≥2 palabras de contenido, así que
 * "Not" no cubría el ítem de bloqueos; la directiva seguía ordenando preguntar
 * por ellos y la persona se contradecía en la misma línea ("so you are not
 * blocked. What is the blocker…?").
 */

import { describe, expect, it } from "vitest";
import { advanceScene, createSceneState, isClosedNegative } from "@/domain/chat/scene-state";

function standupWithBlockersPending() {
  const state = createSceneState("daily_standup");
  if (!state) throw new Error("daily_standup debe tener checklist");
  const a = advanceScene(state, "yesterday i finished the retry logic.");
  return advanceScene(a, "today i plan to run the load test.");
}

describe("isClosedNegative", () => {
  it("reconoce negaciones breves como respuesta cerrada", () => {
    for (const answer of ["Not", "No", "no.", "Nope", "Nothing", "None", "nothing much", "not really"]) {
      expect(isClosedNegative(answer), answer).toBe(true);
    }
  });

  it("no confunde relleno ni respuestas con contenido", () => {
    expect(isClosedNegative("yeah, ok sure")).toBe(false);
    expect(isClosedNegative("no, i am blocked by the DBA approval")).toBe(false);
    expect(isClosedNegative("i finished the migration")).toBe(false);
  });
});

describe("advanceScene con negación breve", () => {
  it("cubre el objetivo pendiente con un 'Not'", () => {
    const state = standupWithBlockersPending();
    expect(state.pending.map((p) => p.id)).toEqual(["blockers"]);
    const after = advanceScene(state, "Not");
    expect(after.pending).toEqual([]);
    expect(after.covered.map((c) => c.id)).toContain("blockers");
  });

  it("guarda la negación como el hecho dicho", () => {
    const after = advanceScene(standupWithBlockersPending(), "Nothing");
    expect(after.covered[after.covered.length - 1]?.fact).toBe("Nothing");
  });

  it("sigue ignorando el relleno puro", () => {
    const state = standupWithBlockersPending();
    expect(advanceScene(state, "yeah, ok sure").pending).toHaveLength(1);
  });
});
