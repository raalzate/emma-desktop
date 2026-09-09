/**
 * FR-013 (rediseño «Café sereno»): cabecera del chat con título en display,
 * badge CEFR mono sobre azul suave, contador de turnos con puntos y pill de
 * objetivos con borde — todo con tokens, sin colores Tailwind crudos.
 *
 * Render estático en servidor (patrón de app-shell.test.tsx): sin DOM, el
 * markup basta para fijar clases y copys.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { ChatHeader } from "@/components/chat/chat-header";
import { scenariosForLevel } from "@/domain/scenarios/scenario-catalog";

const scenarios = scenariosForLevel("B1");

function render(over: Partial<Parameters<typeof ChatHeader>[0]> = {}): string {
  return renderToStaticMarkup(
    createElement(ChatHeader, {
      scenarios,
      scenario: scenarios[0],
      onSelect: () => {},
      level: "B1",
      turnCount: 4,
      maxTurns: 12,
      sceneGoals: { done: 2, total: 3 },
      ...over,
    }),
  );
}

/** Ocurrencias exactas de una subcadena. */
function veces(html: string, sub: string): number {
  return html.split(sub).length - 1;
}

describe("ChatHeader (rediseño Café sereno, FR-013)", () => {
  it("pinta el título de la escena con la tipografía display", () => {
    expect(render()).toContain("font-headline");
  });

  it("pinta el badge CEFR en mono sobre azul suave", () => {
    const html = render();
    // El elemento cuyo contenido es «B1» lleva las tres clases del token.
    const badge = html.match(/<span[^>]*>B1<\/span>/)?.[0] ?? "";
    expect(badge).toContain("font-code");
    expect(badge).toContain("bg-primary-soft");
    expect(badge).toContain("text-primary-deep");
  });

  it("muestra el contador de turnos como texto y puntos llenos/vacíos", () => {
    const html = render({ turnCount: 4, maxTurns: 12 });
    expect(html).toContain("Turno 4 de 12");
    // 4 puntos llenos (bg-primary) y 8 vacíos (bg-border).
    expect(veces(html, 'rounded-full bg-primary"')).toBe(4);
    expect(veces(html, 'rounded-full bg-border"')).toBe(8);
  });

  it("muestra la pill de objetivos con borde", () => {
    const html = render();
    expect(html).toContain("Objetivos 2/3");
    expect(html).toMatch(/<[^>]*border-border[^>]*>[^<]*(<[^>]+>[^<]*)*Objetivos 2\/3/);
  });

  it("no usa colores Tailwind crudos en el fuente", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/components/chat/chat-header.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/\b(emerald|amber|rose|sky|slate|zinc|gray|blue|red|green)-\d{2,3}\b/);
  });
});
