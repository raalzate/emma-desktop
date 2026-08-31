/**
 * Elaboración: la persona pide un detalle concreto cuando la respuesta del
 * aprendiz es mínima, antes de cambiar de tema.
 *
 * El "why": aceptar respuestas de una línea deja la producción por debajo de lo
 * que el método mide ("monólogo sostenido") y desperdicia el turno. El umbral
 * escala con el nivel MCER: a un A1 se le piden frases, a un B2 desarrollo.
 */

import { describe, expect, it } from "vitest";
import { buildElaborationCue, needsElaboration } from "@/domain/chat/elaboration";

describe("needsElaboration", () => {
  it("pide más a un B1 que responde con una frase escueta", () => {
    expect(needsElaboration("i fixed the login bug.", "B1")).toBe(true);
  });

  it("acepta esa misma frase en A1, donde ya es producción válida", () => {
    expect(needsElaboration("i fixed the login bug.", "A1")).toBe(false);
  });

  it("no pide más cuando la respuesta ya tiene desarrollo", () => {
    expect(
      needsElaboration(
        "yesterday i finished the retry logic, opened the pull request and asked Tom to review the error handling.",
        "B1",
      ),
    ).toBe(false);
  });

  it("exige más desarrollo a un B2 que a un A2 con la misma respuesta", () => {
    const reply = "i am running the load test and checking the metrics.";
    expect(needsElaboration(reply, "A2")).toBe(false);
    expect(needsElaboration(reply, "B2")).toBe(true);
  });

  it("no persigue una respuesta cerrada legítima", () => {
    expect(needsElaboration("no blockers.", "B2")).toBe(false);
    expect(needsElaboration("nothing blocking me.", "B2")).toBe(false);
    expect(needsElaboration("not really.", "B2")).toBe(false);
  });

  it("no pide elaboración sobre relleno (eso lo maneja el checklist)", () => {
    expect(needsElaboration("yeah, ok", "B1")).toBe(false);
  });
});

describe("buildElaborationCue", () => {
  it("pide un detalle concreto sin cambiar de tema y en personaje", () => {
    const cue = buildElaborationCue().toLowerCase();
    expect(cue).toContain("short");
    expect(cue).toMatch(/detail|specific/);
    expect(cue).toMatch(/before moving on|without changing/);
  });
});

describe("calibración: no perseguir respuestas de stand-up válidas", () => {
  // Caso real que disparaba la petición de detalle en el primer turno.
  const standupAnswer = "I finished the report for the client.";

  it("acepta una respuesta completa de stand-up en A1 y A2", () => {
    expect(needsElaboration(standupAnswer, "A1")).toBe(false);
    expect(needsElaboration(standupAnswer, "A2")).toBe(false);
  });

  it("sigue pidiendo desarrollo en B1 y B2, donde se espera más", () => {
    expect(needsElaboration(standupAnswer, "B1")).toBe(true);
    expect(needsElaboration(standupAnswer, "B2")).toBe(true);
  });
});
