/**
 * FR-019/020 (rediseño «Café sereno»): los chips del andamiaje usan los tokens
 * scaffold (clases literales completas: el purge de Tailwind no ve clases
 * compuestas) con punto de color por nivel, y el grupo lleva el tag mono con
 * borde punteado «ANDAMIAJE · ES». Siguen siendo de solo lectura y en inglés.
 */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import type { ReplySuggestion } from "@/domain/coaching/reply-suggestion";

const sugerencias: ReplySuggestion[] = [
  { levelHint: "easy", text: "Yes, a slice of banana bread, please." },
  { levelHint: "mid", text: "What else do you recommend with coffee?" },
  { levelHint: "advanced", text: "I'm tempted, but I'm cutting back on sugar." },
];

function render(): string {
  return renderToStaticMarkup(createElement(SuggestionChips, { suggestions: sugerencias }));
}

describe("SuggestionChips (rediseño Café sereno)", () => {
  it("cada nivel usa su token scaffold con fondo suave y punto de color (FR-019)", () => {
    const html = render();
    expect(html).toContain("bg-scaffold-easy-bg");
    expect(html).toContain("bg-scaffold-easy");
    expect(html).toContain("bg-scaffold-mid-bg");
    expect(html).toContain("bg-scaffold-mid");
    expect(html).toContain("bg-scaffold-hard-bg");
    expect(html).toContain("bg-scaffold-hard");
  });

  it("no quedan colores Tailwind crudos en el fuente (FR-019)", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/components/chat/suggestion-chips.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/\b(emerald|amber|rose)-\d{2,3}\b/);
  });

  it("el grupo lleva el tag mono punteado «ANDAMIAJE · ES» (FR-020)", () => {
    const html = render();
    expect(html).toContain("ANDAMIAJE · ES");
    expect(html).toMatch(/font-code[^"]*border-dashed|border-dashed[^"]*font-code/);
  });

  it("los chips siguen siendo de solo lectura y en inglés (Artículo 9)", () => {
    const html = render();
    for (const s of sugerencias) {
      // El texto llega escapado por el render estático: comparamos sin apóstrofes.
      expect(html).toContain(s.text.split("'")[0]);
    }
    // Solo lectura: ningún chip es botón ni input.
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<input");
  });
});
