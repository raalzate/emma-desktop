import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BrandWordmark } from "@/components/nav/brand-wordmark";

// Render en servidor (sin DOM) vía createElement: el tsconfig de Next usa
// `jsx: preserve` y vitest no transforma JSX en los tests.
describe("BrandWordmark", () => {
  it("muestra «emma» en minúscula con la tipografía display en negrita", () => {
    const html = renderToStaticMarkup(createElement(BrandWordmark));
    expect(html).toContain("emma");
    expect(html).toContain("font-headline");
    expect(html).toContain("font-bold");
    expect(html).toContain("lowercase");
  });

  it("remata con un punto en color acento (ámbar)", () => {
    const html = renderToStaticMarkup(createElement(BrandWordmark));
    expect(html).toMatch(/<span class="text-accent">\.<\/span>/);
  });

  it("acepta clases adicionales vía className", () => {
    const html = renderToStaticMarkup(createElement(BrandWordmark, { className: "text-3xl" }));
    expect(html).toContain("text-3xl");
  });
});
