/**
 * #202 — el chat también respeta el bloqueo de la ruta: «Next scene» del
 * cierre y el selector de escena pasan por el mismo gate que el trazado, y
 * un cambio bloqueado muestra el aviso de lecciones pendientes en vez de
 * abrir la escena.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const chatView = readFileSync("src/components/chat/chat-view.tsx", "utf8");
const chatPage = readFileSync("src/app/chat/page.tsx", "utf8");

describe("ChatView — cambiar de escena pasa por el gate", () => {
  it("usa el hook común del gate", () => {
    expect(chatView).toContain("useScenarioGate");
  });

  it("el selector y «Next scene» reciben el cambio con gate, no el arranque directo", () => {
    expect(chatView).toMatch(/onSelectScenario=\{selectScenario\}/);
    expect(chatView).not.toMatch(/onSelectScenario=\{startNew\}/);
  });

  it("un cambio bloqueado muestra el aviso de lecciones pendientes", () => {
    expect(chatView).toContain("PendingLessonsNotice");
  });
});

describe("página del chat — el deep link usa el mismo hook", () => {
  it("no duplica la regla: consulta useScenarioGate", () => {
    expect(chatPage).toContain("useScenarioGate");
    expect(chatPage).not.toContain("canStartScenario(");
  });
});
