import { describe, expect, it } from "vitest";
import {
  MAX_GRACE_TURNS,
  WRAP_UP_CUE,
  endsWithQuestion,
  resolveSceneClose,
  shouldWrapUp,
} from "@/domain/chat/scene-closing";

describe("endsWithQuestion", () => {
  it("detecta una respuesta que termina preguntando", () => {
    expect(endsWithQuestion("Can you tell me what you tried to do to get it?")).toBe(true);
  });

  it("detecta la pregunta aunque haya espacios o comillas al final", () => {
    expect(endsWithQuestion('So... what did you try?  ')).toBe(true);
    expect(endsWithQuestion('He asked "what now?"')).toBe(true);
  });

  it("no confunde un cierre afirmativo con una pregunta", () => {
    expect(endsWithQuestion("Thanks, that's all I needed. Good luck!")).toBe(false);
  });

  it("ignora una pregunta que no está al final", () => {
    expect(endsWithQuestion("What did you try? Anyway, I'll unblock you now.")).toBe(false);
  });

  it("tolera texto vacío", () => {
    expect(endsWithQuestion("")).toBe(false);
    expect(endsWithQuestion("   ")).toBe(false);
  });
});

describe("shouldWrapUp", () => {
  it("avisa en el penúltimo turno para que la persona cierre sin preguntar", () => {
    expect(shouldWrapUp(7, 8)).toBe(true);
  });

  it("avisa también si el presupuesto ya se alcanzó", () => {
    expect(shouldWrapUp(8, 8)).toBe(true);
  });

  it("no avisa en mitad de la escena", () => {
    expect(shouldWrapUp(3, 8)).toBe(false);
  });

  it("la señal de cierre prohíbe explícitamente preguntar de nuevo", () => {
    expect(WRAP_UP_CUE.toLowerCase()).toContain("do not ask");
  });
});

describe("resolveSceneClose", () => {
  const base = {
    checklistComplete: false,
    turn: 8,
    maxTurns: 8,
    lastReply: "Thanks, that's everything. Talk later!",
    graceTurnsUsed: 0,
  };

  it("cierra cuando el checklist quedó completo (la persona ya se despidió)", () => {
    expect(resolveSceneClose({ ...base, checklistComplete: true, turn: 3 })).toEqual({
      close: true,
      grantGrace: false,
      deepen: false,
    });
  });

  it("cierra al agotar el presupuesto si la persona no dejó una pregunta abierta", () => {
    expect(resolveSceneClose(base)).toEqual({ close: true, grantGrace: false, deepen: false });
  });

  it("NO cierra si la persona acabó preguntando: concede un turno de gracia", () => {
    expect(
      resolveSceneClose({ ...base, lastReply: "Can you tell me what you tried?" }),
    ).toEqual({ close: false, grantGrace: true, deepen: false });
  });

  it("deja de conceder gracia al llegar al tope y cierra", () => {
    expect(
      resolveSceneClose({
        ...base,
        lastReply: "And what did you try next?",
        graceTurnsUsed: MAX_GRACE_TURNS,
      }),
    ).toEqual({ close: true, grantGrace: false, deepen: false });
  });

  it("no cierra mientras queden turnos de presupuesto", () => {
    expect(resolveSceneClose({ ...base, turn: 4 })).toEqual({ close: false, grantGrace: false, deepen: false });
  });

  it("el checklist completo manda incluso si quedó una pregunta abierta", () => {
    expect(
      resolveSceneClose({
        ...base,
        checklistComplete: true,
        turn: 2,
        lastReply: "Anything else you need?",
      }),
    ).toEqual({ close: true, grantGrace: false, deepen: false });
  });
});
