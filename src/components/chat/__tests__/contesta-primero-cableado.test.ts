/**
 * Cableado de «contestar primero» (T11 de #323): send le pasa a la directiva la
 * pregunta directa del aprendiz. Fuente como texto (no hay render del hook).
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";

const hook = fs.readFileSync("src/components/chat/use-chat-session.ts", "utf8");

describe("contestar primero en use-chat-session", () => {
  it("la directiva recibe la pregunta del mensaje del aprendiz", () => {
    const call = hook.slice(hook.indexOf("buildTurnDirective({"), hook.indexOf("buildTurnDirective({") + 600);
    expect(call).toMatch(/learnerQuestion: learnerQuestionOf\(clean\)/);
  });
});

describe("rotación de la consigna de detalle (T13 de #323)", () => {
  it("la directiva recibe el número de turno", () => {
    const call = hook.slice(hook.indexOf("buildTurnDirective({"), hook.indexOf("buildTurnDirective({") + 600);
    expect(call).toMatch(/\n\s+turn,\n/);
  });
});
