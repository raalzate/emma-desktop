import { describe, it, expect } from "vitest";
import {
  startDrill,
  submitDraft,
  retryItem,
  revealHint,
  nextItem,
  restartWithFailed,
  summarizeDrill,
} from "../drill-session";
import type { UnitExercise } from "../exercise";

const exercise: UnitExercise = {
  id: "14A",
  unit: 14,
  kind: "fill",
  promptEs: "Completa",
  items: [
    { stem: "1 ____", answer: "was" },
    { stem: "2 ____", answer: "had been running" },
    { stem: "3 ____", answer: "broke" },
  ],
};

describe("sesión de ejercicio", () => {
  it("arranca en el primer ítem respondiendo, sin racha", () => {
    const s = startDrill(exercise);
    expect(s.index).toBe(0);
    expect(s.phase).toBe("answering");
    expect(s.streak).toBe(0);
  });

  it("acierto a la primera: pasa a revisión y suma racha", () => {
    const s = submitDraft(startDrill(exercise), "was");
    expect(s.phase).toBe("reviewing");
    expect(s.streak).toBe(1);
    expect(s.results[0]).toMatchObject({ index: 0, verdict: "correct", attempts: 1, hintsUsed: 0 });
  });

  it("casi: ofrece reintento sin cerrar el ítem", () => {
    let s = nextItem(submitDraft(startDrill(exercise), "was"));
    s = submitDraft(s, "had been runing");
    expect(s.phase).toBe("retrying");
    expect(s.lastDiagnosis?.verdict).toBe("near");
    expect(s.results).toHaveLength(1);
  });

  it("reintento acertado cuenta como correcto con 2 intentos y mantiene racha", () => {
    let s = nextItem(submitDraft(startDrill(exercise), "was"));
    s = submitDraft(s, "had been runing");
    s = retryItem(s);
    expect(s.phase).toBe("answering");
    s = submitDraft(s, "had been running");
    expect(s.results[1]).toMatchObject({ verdict: "correct", attempts: 2 });
    expect(s.streak).toBe(2);
  });

  it("segundo fallo tras reintento cierra el ítem como wrong y corta la racha", () => {
    let s = nextItem(submitDraft(startDrill(exercise), "was"));
    s = retryItem(submitDraft(s, "had been runing"));
    s = submitDraft(s, "ran");
    expect(s.phase).toBe("reviewing");
    expect(s.results[1]).toMatchObject({ verdict: "wrong", attempts: 2 });
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(1);
  });

  it("la pista sube de nivel hasta 2 y queda registrada en el resultado", () => {
    let s = revealHint(revealHint(revealHint(startDrill(exercise))));
    expect(s.hintLevel).toBe(2);
    s = submitDraft(s, "was");
    expect(s.results[0].hintsUsed).toBe(2);
  });

  it("nextItem tras el último ítem termina la sesión", () => {
    let s = startDrill(exercise);
    for (const answer of ["was", "x", "broke"]) s = nextItem(submitDraft(s, answer));
    expect(s.phase).toBe("finished");
  });

  it("el resumen cuenta aciertos, fallos, racha y un mensaje según el resultado", () => {
    let s = startDrill(exercise);
    for (const answer of ["was", "x", "broke"]) s = nextItem(submitDraft(s, answer));
    const summary = summarizeDrill(s);
    expect(summary).toMatchObject({ total: 3, correct: 2, failedIndexes: [1], bestStreak: 1 });
    expect(summary.masteryPct).toBe(67);
    expect(summary.messageEs.length).toBeGreaterThan(0);
  });

  it("resumen perfecto y resumen flojo dan mensajes distintos", () => {
    let perfect = startDrill(exercise);
    for (const a of ["was", "had been running", "broke"]) perfect = nextItem(submitDraft(perfect, a));
    let weak = startDrill(exercise);
    for (const a of ["x", "y", "z"]) weak = nextItem(submitDraft(weak, a));
    expect(summarizeDrill(perfect).messageEs).not.toBe(summarizeDrill(weak).messageEs);
  });

  it("restartWithFailed rehace solo los ítems fallados", () => {
    let s = startDrill(exercise);
    for (const answer of ["was", "x", "y"]) s = nextItem(submitDraft(s, answer));
    const again = restartWithFailed(s);
    expect(again.phase).toBe("answering");
    expect(again.exercise.items.map((i) => i.answer)).toEqual(["had been running", "broke"]);
    expect(again.round).toBe(2);
  });

  it("submit con borrador vacío no hace nada", () => {
    const s = startDrill(exercise);
    expect(submitDraft(s, "  ")).toBe(s);
  });
});
