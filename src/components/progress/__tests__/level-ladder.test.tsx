import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LevelLadder } from "@/components/progress/level-ladder";
import { levelLabel } from "@/domain/cefr/cefr-ladder";

// Render en servidor (sin DOM) vía createElement, igual que el resto de
// pruebas de componentes del repo.
function render(current: string, percent?: number): string {
  return renderToStaticMarkup(createElement(LevelLadder, { current, percent }));
}

/** Devuelve el <li> del peldaño cuyo texto contiene el nivel dado. */
function peldanoDe(html: string, cefr: string): string {
  const nivel = levelLabel(cefr);
  const items = html.match(/<li\b[\s\S]*?<\/li>/g) ?? [];
  return items.find((li) => li.includes(`>${nivel}<`) || li.includes(`>${nivel}</`)) ?? "";
}

describe("LevelLadder (rediseño Café sereno, FR-025)", () => {
  it("pinta los cinco niveles como «Level 1»…«Level 5» en pills font-code, sin códigos CEFR", () => {
    const html = render("B1");
    for (const nivel of ["A1", "A2", "B1", "B2", "C1"]) {
      expect(peldanoDe(html, nivel)).not.toBe("");
    }
    for (const n of [1, 2, 3, 4, 5]) expect(html).toContain(`Level ${n}`);
    expect(html).not.toMatch(/\b(A1|A2|B1|B2|C1|CEFR)\b/);
    expect(html).toContain("font-code");
  });

  it("rellena con primary los niveles ya completados", () => {
    const html = render("B1");
    expect(peldanoDe(html, "A1")).toContain("bg-primary");
    expect(peldanoDe(html, "A2")).toContain("bg-primary");
  });

  it("resalta el nivel actual con borde primary y su porcentaje", () => {
    const html = render("B1", 62);
    const actual = peldanoDe(html, "B1");
    expect(actual).toContain("border-primary");
    expect(actual).toContain('aria-current="step"');
    expect(actual).toContain("62%");
  });

  it("omite el porcentaje cuando no hay dato", () => {
    const html = render("B1");
    expect(html).not.toContain("%");
  });

  it("apaga los niveles futuros con secondary y tinta muted", () => {
    const html = render("B1");
    const futuro = peldanoDe(html, "C1");
    expect(futuro).toContain("bg-secondary");
    expect(futuro).toContain("text-muted-foreground");
    expect(futuro).not.toContain("bg-primary ");
  });

  it("conecta con segmento primary hasta el nivel actual y neutro después", () => {
    const html = render("B1");
    // El segmento vive dentro del <li> del nivel destino.
    expect(peldanoDe(html, "A2")).toContain("bg-primary");
    expect(peldanoDe(html, "B2")).toContain("bg-border");
  });
});
