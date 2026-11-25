/**
 * Sin juez LLM en el turno (T6 de #323).
 *
 * El juez de escena con el modelo pequeño rechazó 8/9 líneas correctas en vivo
 * (wrong-role / contradicts-facts) y cada rechazo costaba otra generación: era
 * la mayor fuente de latencia del turno sin proteger nada. Queda el chequeo
 * determinista de horas como parte del validador (gratis, sin LLM). Fuente
 * como texto: no hay render del hook en el proyecto.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hook = fs.readFileSync(path.join(root, "src/components/chat/use-chat-session.ts"), "utf8");
const runtime = fs.readFileSync(path.join(root, "src/interface/emma-runtime.ts"), "utf8");
const turn = fs.readFileSync(path.join(root, "src/application/chat/run-chat-turn-use-case.ts"), "utf8");

function chatTurnCall(): string {
  const start = hook.indexOf("await runtime.chatTurn(");
  expect(start, "send debe llamar a runtime.chatTurn").toBeGreaterThan(-1);
  return hook.slice(start, hook.indexOf('setStreaming("")', start));
}

describe("turno sin juez LLM", () => {
  it("send no pasa judgeReply y el caso de uso ya no lo acepta", () => {
    expect(chatTurnCall()).not.toMatch(/judgeReply/);
    expect(turn).not.toMatch(/judgeReply/);
  });

  it("el runtime no expone el juez de escena", () => {
    expect(runtime).not.toMatch(/judgeSceneFidelity/);
  });

  it("el validador incluye el chequeo determinista de horas contra los hechos generados", () => {
    const call = chatTurnCall();
    expect(call).toMatch(/validateReply:/);
    expect(call).toMatch(/detectTimeDrift\(r, judgeFacts\(contract, situation\)\)/);
  });

  it("los hechos vigentes están en las dependencias del callback de envío", () => {
    const deps = hook.slice(hook.indexOf("[busy, messages, turnCount, runtime"));
    expect(deps.slice(0, deps.indexOf("]"))).toMatch(/contract/);
  });

  it("la respuesta final reemplaza el texto en streaming", () => {
    const call = hook.indexOf("await runtime.chatTurn(");
    const tail = hook.slice(call, call + 4000);
    const push = tail.indexOf('setMessages((m) => [...m, { role: "assistant", content: reply');
    const clear = tail.indexOf('setStreaming("")');
    expect(push).toBeGreaterThan(-1);
    expect(clear).toBeGreaterThan(push);
    expect(clear - push).toBeLessThan(200);
  });
});
