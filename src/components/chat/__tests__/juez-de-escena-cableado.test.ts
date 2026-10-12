/**
 * Cableado del juez de escena en use-chat-session (FR-006, FR-007).
 *
 * Fuente como texto (no hay render del hook en el proyecto; técnica de
 * `juez-antes-que-gramatica.test.ts`). Se fija lo que alguien podría romper al
 * refactorizar `send`: que el juez reciba los hechos y la persona, que haya
 * respaldo sin contrato y que la respuesta final reemplace el streaming.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hook = fs.readFileSync(path.join(root, "src/components/chat/use-chat-session.ts"), "utf8");
const runtime = fs.readFileSync(path.join(root, "src/interface/emma-runtime.ts"), "utf8");

/** El cuerpo de la llamada a runtime.chatTurn({...}) dentro de send. */
function chatTurnCall(): string {
  const start = hook.indexOf("await runtime.chatTurn(");
  expect(start, "send debe llamar a runtime.chatTurn").toBeGreaterThan(-1);
  return hook.slice(start, hook.indexOf("setStreaming(\"\")", start));
}

describe("juez de escena en use-chat-session", () => {
  it("chatTurn recibe judgeReply que llama al juez del runtime", () => {
    const call = chatTurnCall();
    expect(call).toMatch(/judgeReply:/);
    expect(call).toMatch(/runtime\.judgeSceneFidelity\(/);
  });

  it("juzga con los hechos del contrato y, sin contrato, con el framing de la situación", () => {
    expect(hook).toMatch(/contract\?\.facts[^;]*situation\?\.framingDescription/);
  });

  it("juzga con el nombre y el rol de la persona", () => {
    const call = chatTurnCall();
    expect(call).toMatch(/personaName/);
    expect(call).toMatch(/personaRole/);
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
    expect(clear, "el streaming se limpia junto con el push de la respuesta final").toBeGreaterThan(push);
    expect(clear - push).toBeLessThan(200);
  });
});

describe("juez de escena en el runtime", () => {
  it("chatTurn acepta judgeReply y expone judgeSceneFidelity", () => {
    expect(runtime).toMatch(/judgeReply\?:/);
    expect(runtime).toMatch(/judgeSceneFidelity: \(a\) => judgeSceneFidelity\(\{ llm, \.\.\.a \}\)/);
  });
});
