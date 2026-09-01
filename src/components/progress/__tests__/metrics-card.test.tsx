import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MetricsCardView } from "@/components/progress/metrics-card";

const averages = {
  responseLatencySeconds: 3.24,
  longestMonologueWords: 42.4,
  errorDensityPer100Words: 4.06,
};

function render(): string {
  return renderToStaticMarkup(createElement(MetricsCardView, { averages }));
}

describe("MetricsCardView (rediseño Café sereno, FR-027)", () => {
  it("es una tarjeta bg-card con borde y esquinas bubble", () => {
    const html = render();
    expect(html).toContain("bg-card");
    expect(html).toContain("border-border");
    expect(html).toContain("rounded-bubble");
  });

  it("muestra la cifra principal grande en font-headline", () => {
    const html = render();
    expect(html).toContain("font-headline");
    expect(html).toContain("3.2");
    expect(html).toContain("42");
    expect(html).toContain("4.1");
  });

  it("etiqueta cada métrica en font-code uppercase con icono", () => {
    const html = render();
    expect(html).toContain("font-code");
    expect(html).toContain("uppercase");
    expect(html).toContain("Latencia de respuesta");
    expect(html).toContain("Monólogo sostenido");
    expect(html).toContain("Densidad de error");
    // Cada label lleva su icono lucide al lado.
    expect(html.match(/<svg/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("conserva la nota de las métricas que se autoevalúan", () => {
    expect(render()).toContain("se autoevalúan manualmente");
  });
});
