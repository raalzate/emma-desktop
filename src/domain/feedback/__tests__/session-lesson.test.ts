import { describe, expect, it } from "vitest";
import { isSessionLesson, type SessionLesson } from "../session-lesson";

const valida: SessionLesson = {
  report: "## Tu lección\nBuen trabajo.",
  lesson: "You did well today.",
  verdict: "¡Escenario superado!",
  decision: { promoted: false, newLevel: "B1", passed: true },
  at: 1_700_000_000_000,
};

describe("isSessionLesson", () => {
  it("acepta una lección completa", () => {
    expect(isSessionLesson(valida)).toBe(true);
  });

  it("acepta lesson en null (el LLM no entregó audio-lección)", () => {
    expect(isSessionLesson({ ...valida, lesson: null })).toBe(true);
  });

  it("rechaza lo que no es objeto", () => {
    expect(isSessionLesson(null)).toBe(false);
    expect(isSessionLesson("texto")).toBe(false);
    expect(isSessionLesson(undefined)).toBe(false);
  });

  it("rechaza un reporte vacío: sin reporte no hay nada que revisar", () => {
    expect(isSessionLesson({ ...valida, report: "   " })).toBe(false);
  });

  it("rechaza una decisión incompleta del store", () => {
    expect(isSessionLesson({ ...valida, decision: { promoted: false } })).toBe(false);
  });

  it("rechaza una marca de tiempo que no es número finito", () => {
    expect(isSessionLesson({ ...valida, at: "ayer" })).toBe(false);
    expect(isSessionLesson({ ...valida, at: Number.NaN })).toBe(false);
  });
});
