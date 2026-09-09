import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecommendedNext } from "@/components/progress/recommended-next";
import {
  RecommendationReason,
  type NextScenarioRecommendation,
} from "@/domain/pathway/next-scenario-policy";

const recomendacion: NextScenarioRecommendation = {
  scenarioType: "code-review",
  title: "Code Review",
  reason: RecommendationReason.CATALOG_ORDER,
};

function render(onPractice?: (scenarioType: string) => void): string {
  return renderToStaticMarkup(
    createElement(RecommendedNext, { recommendation: recomendacion, onPractice }),
  );
}

describe("RecommendedNext (rediseño Café sereno, FR-028)", () => {
  it("no pinta nada sin recomendación", () => {
    const html = renderToStaticMarkup(createElement(RecommendedNext, { recommendation: null }));
    expect(html).toBe("");
  });

  it("es una tarjeta bg-primary-soft con esquinas bubble", () => {
    const html = render();
    expect(html).toContain("bg-primary-soft");
    expect(html).toContain("rounded-bubble");
  });

  it("lleva el tag «Recomendado para hoy» en font-code uppercase", () => {
    const html = render();
    expect(html).toContain("Recomendado para hoy");
    expect(html).toContain("font-code");
    expect(html).toContain("uppercase");
  });

  it("muestra título en font-headline y el motivo de la sugerencia", () => {
    const html = render();
    expect(html).toContain("font-headline");
    expect(html).toContain("Code Review");
    expect(html).toContain("Siguiente en tu ruta de aprendizaje");
  });

  it("con onPractice muestra CTA primario y secundario con borde", () => {
    const html = render(vi.fn());
    expect(html).toContain("Practicar ahora");
    expect(html).toContain("bg-primary");
    expect(html).toContain("Ver mi progreso");
    expect(html).toContain("border");
    // Next normaliza el trailing slash del href en SSR.
    expect(html).toMatch(/href="\/progress\/?"/);
  });

  it("sin onPractice no muestra los CTA (contexto solo informativo)", () => {
    const html = render();
    expect(html).not.toContain("Practicar ahora");
  });
});
