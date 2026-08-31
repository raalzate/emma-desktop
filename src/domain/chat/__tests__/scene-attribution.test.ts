/**
 * Atribución de la respuesta al ítem del checklist que realmente contesta.
 *
 * El defecto: `advanceScene` asignaba al primer pendiente sin mirar el
 * contenido, así que hablar del presente ("I'm working on the testing phase")
 * consumía el ítem `yesterday` y la persona volvía a preguntar por el plan de
 * hoy — redundancia que se lee como despiste.
 */

import { describe, expect, it } from "vitest";
import { advanceScene, createSceneState } from "@/domain/chat/scene-state";

function standup() {
  const state = createSceneState("daily_standup");
  if (!state) throw new Error("daily_standup debe tener checklist");
  return state;
}

describe("advanceScene — atribución por contenido", () => {
  it("cuenta como 'today' una respuesta en presente sobre el trabajo en curso", () => {
    const after = advanceScene(standup(), "i am working on the final testing phase for the new module.");
    expect(after.covered.map((c) => c.id)).toEqual(["today"]);
    expect(after.pending.map((p) => p.id)).toEqual(["yesterday", "blockers"]);
  });

  it("cuenta como 'yesterday' una respuesta sobre trabajo terminado", () => {
    const after = advanceScene(standup(), "yesterday i finished the retry logic and merged the PR.");
    expect(after.covered.map((c) => c.id)).toEqual(["yesterday"]);
  });

  it("salta directo a 'blockers' cuando el aprendiz declara un bloqueo", () => {
    const after = advanceScene(standup(), "i am blocked because i am waiting for the DBA approval.");
    expect(after.covered.map((c) => c.id)).toEqual(["blockers"]);
    expect(after.pending.map((p) => p.id)).toEqual(["yesterday", "today"]);
  });

  it("reconoce 'no blockers' como respuesta al ítem de bloqueos", () => {
    const after = advanceScene(standup(), "no blockers on my side, everything is fine.");
    expect(after.covered.map((c) => c.id)).toEqual(["blockers"]);
  });

  it("sin señales claras cubre el ítem que se preguntó (primer pendiente)", () => {
    const after = advanceScene(standup(), "the new module and the reports.");
    expect(after.covered.map((c) => c.id)).toEqual(["yesterday"]);
  });

  it("no consume ítems con relleno o smalltalk", () => {
    const after = advanceScene(standup(), "yeah, ok sure");
    expect(after.covered).toEqual([]);
    expect(after.pending).toHaveLength(3);
  });

  it("guarda el hecho literal junto al ítem atribuido", () => {
    const after = advanceScene(standup(), "i am blocked by the missing API key.");
    expect(after.covered[0]?.fact).toBe("i am blocked by the missing API key.");
  });

  it("encadena respuestas fuera de orden sin repetir ítems", () => {
    const first = advanceScene(standup(), "i am blocked waiting on the security review.");
    const second = advanceScene(first, "yesterday i wrapped up the migration script.");
    const third = advanceScene(second, "today i plan to start the backfill.");
    expect(second.covered.map((c) => c.id)).toEqual(["blockers", "yesterday"]);
    expect(third.covered.map((c) => c.id)).toEqual(["blockers", "yesterday", "today"]);
    expect(third.pending).toEqual([]);
  });
});
