/**
 * Continuación neutral (T7 de #323): cuando las dos generaciones del turno
 * fallan, la persona acusa recibo y devuelve el turno — sin re-preguntar lo
 * ya contestado, sin declarar amnesia y sin frases de otra escena.
 */
import { describe, expect, it } from "vitest";
import { neutralContinuation } from "../scene-recovery";

describe("neutralContinuation", () => {
  it("no es una pregunta repetida ni una línea amnésica", () => {
    const line = neutralContinuation("What did you do yesterday?");
    expect(line).not.toMatch(/train of thought|where were we|put it another way|yesterday/i);
    expect(line).not.toMatch(/\b(AI|model|EMMA)\b/);
  });

  it("no repite el último turno de la persona", () => {
    const first = neutralContinuation("");
    expect(neutralContinuation(first)).not.toBe(first);
  });

  it("no habla de bloqueos ni de tareas: sirve en cualquier escena", () => {
    for (const last of ["", "Got it. Tell me a bit more about that.", "Okay, I see. Go on."]) {
      expect(neutralContinuation(last)).not.toMatch(/block|plate|standup|ticket/i);
    }
  });
});
