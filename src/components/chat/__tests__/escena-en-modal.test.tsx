/**
 * #167 — la escena se puede volver a ver durante el chat. El cuerpo del modal
 * es puro (sin portal ni estado), así que se fija con render estático: el mismo
 * contenido que se narró al entrar, sin tecleo, y el estado «Creando tu
 * escena…» cuando la escena todavía se está generando.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SceneDialogBody } from "@/components/chat/scene-dialog";
import { ChatHeader } from "@/components/chat/chat-header";
import { scenariosForLevel } from "@/domain/scenarios/scenario-catalog";
import { situationsFor } from "@/domain/situations/situations-catalog";

const scenarios = scenariosForLevel("B1");
const scenario = scenarios[0];
const situation = situationsFor(scenario.scenarioType)[0] ?? null;

function body(over: Partial<Parameters<typeof SceneDialogBody>[0]> = {}): string {
  return renderToStaticMarkup(
    createElement(SceneDialogBody, { scenario, situation, sceneReady: true, ...over }),
  );
}

describe("SceneDialogBody — la escena consultable durante el chat", () => {
  it("muestra la narrativa, el personaje y la misión de la escena", () => {
    const html = body();
    expect(html).toContain(scenario.title);
    // El apóstrofo sale escapado en el markup estático: se busca el resto.
    expect(html).toMatch(/talking with/);
    if (situation) expect(html).toContain("Your goal in this scene");
  });

  it("no teclea: el texto sale completo, sin cursor de escritura", () => {
    const html = body();
    expect(html).not.toContain("animate-pulse");
    expect(html).not.toContain("Skip intro");
  });

  it("con la escena en preparación avisa «Setting up your scene…» y muestra el respaldo estático", () => {
    const html = body({ sceneReady: false });
    expect(html).toContain("Setting up your scene…");
    expect(html).toContain(scenario.title);
    expect(html.replace(/<[^>]+>/g, "").trim().length).toBeGreaterThan(40);
  });

  it("el contenido de la escena y los rótulos del diálogo van en inglés (Art. 9)", () => {
    const html = body();
    expect(html).toContain("Your goal in this scene");
    expect(html).not.toContain("Tu objetivo en la escena");
  });
});

describe("ChatHeader — acceso permanente a la escena", () => {
  const render = (over: Partial<Parameters<typeof ChatHeader>[0]> = {}) =>
    renderToStaticMarkup(
      createElement(ChatHeader, {
        scenarios,
        scenario,
        onSelect: () => {},
        level: "B1",
        turnCount: 4,
        maxTurns: 12,
        sceneGoals: { done: 2, total: 3 },
        ...over,
      }),
    );

  it("ofrece «View the scene» durante la conversación", () => {
    expect(render({ onShowScene: () => {} })).toContain("View the scene");
  });

  it("sin handler no pinta el botón (antesala: la escena ya está en pantalla)", () => {
    expect(render()).not.toContain("View the scene");
  });
});
