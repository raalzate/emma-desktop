import { describe, it, expect } from "vitest";
import { sessionActivities, xpBreakdown, xpFor } from "../xp-rules";

describe("xpFor — conversación", () => {
  it("da 20 de base más 2 por turno", () => {
    expect(xpFor({ kind: "conversation", turns: 5, errors: 2 })).toBe(30);
  });

  it("topa los turnos que suman en 20", () => {
    expect(xpFor({ kind: "conversation", turns: 50, errors: 1 })).toBe(60);
  });

  it("suma 10 de bono si la sesión no tuvo errores", () => {
    expect(xpFor({ kind: "conversation", turns: 5, errors: 0 })).toBe(40);
  });

  it("no da bono de sesión limpia a una sesión sin turnos", () => {
    expect(xpFor({ kind: "conversation", turns: 0, errors: 0 })).toBe(20);
  });

  it("trata turnos negativos o no enteros como cero o su piso", () => {
    expect(xpFor({ kind: "conversation", turns: -3, errors: 1 })).toBe(20);
    expect(xpFor({ kind: "conversation", turns: 2.9, errors: 1 })).toBe(24);
  });
});

describe("xpFor — otras actividades", () => {
  it.each([
    [{ kind: "scenario-passed" } as const, 30],
    [{ kind: "level-up" } as const, 100],
    [{ kind: "exercise", correct: true } as const, 5],
    [{ kind: "exercise", correct: false } as const, 1],
    [{ kind: "review" } as const, 3],
    [{ kind: "pronunciation", correct: true } as const, 4],
    [{ kind: "pronunciation", correct: false } as const, 1],
    [{ kind: "challenge" } as const, 25],
    [{ kind: "lesson" } as const, 10],
  ])("%o otorga %i XP", (activity, xp) => {
    expect(xpFor(activity)).toBe(xp);
  });
});

describe("xpBreakdown", () => {
  it("desglosa la conversación en base, turnos y sesión limpia", () => {
    expect(xpBreakdown({ kind: "conversation", turns: 3, errors: 0 })).toEqual([
      { label: "Conversation", xp: 20 },
      { label: "3 turns", xp: 6 },
      { label: "Clean session", xp: 10 },
    ]);
  });

  it("omite las líneas en cero", () => {
    expect(xpBreakdown({ kind: "conversation", turns: 0, errors: 1 })).toEqual([
      { label: "Conversation", xp: 20 },
    ]);
  });

  it("usa una sola línea para actividades simples", () => {
    expect(xpBreakdown({ kind: "level-up" })).toEqual([{ label: "Level up", xp: 100 }]);
  });

  it("la suma del desglose es igual a xpFor", () => {
    const activity = { kind: "conversation", turns: 7, errors: 0 } as const;
    const total = xpBreakdown(activity).reduce((s, l) => s + l.xp, 0);
    expect(total).toBe(xpFor(activity));
  });
});

describe("sessionActivities", () => {
  it("una sesión que no superó nada sólo da la conversación", () => {
    expect(sessionActivities({ turns: 4, errors: 1, passed: false, promoted: false })).toEqual([
      { kind: "conversation", turns: 4, errors: 1 },
    ]);
  });

  it("suma escenario superado y subida de nivel cuando corresponden", () => {
    expect(sessionActivities({ turns: 4, errors: 0, passed: true, promoted: true }).map((a) => a.kind)).toEqual([
      "conversation",
      "scenario-passed",
      "level-up",
    ]);
  });
});
