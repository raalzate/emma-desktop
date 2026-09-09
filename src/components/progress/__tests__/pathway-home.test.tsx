import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { PathwayHome } from "@/components/progress/pathway-home";

// El hook de datos se mockea: la prueba valida el markup, no el IO del runtime.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/progress/use-progress-data", () => {
  const pathway = {
    cefrLevel: "B1",
    items: [
      { scenarioType: "s1", title: "Ordering Coffee", status: "passed" },
      { scenarioType: "s2", title: "At the Café", status: "pending" },
      { scenarioType: "s3", title: "Job Interview", status: "pending" },
    ],
  };
  return {
    useProgressData: () => ({
      roadmap: {
        currentLevel: "B1",
        levels: [{ cefrLevel: "B1", state: "in_progress", pathway }],
      },
      recommendation: {
        scenarioType: "s2",
        title: "At the Café",
        reason: "catalog-order",
      },
      loading: false,
      reload: vi.fn(),
    }),
  };
});

function render(): string {
  const runtime = {} as unknown as EmmaRuntime;
  return renderToStaticMarkup(createElement(PathwayHome, { runtime, level: "B1" }));
}

describe("PathwayHome (rediseño Café sereno, FR-023/FR-024)", () => {
  it("saluda con font-headline y subtítulo en tinta muted", () => {
    const html = render();
    expect(html).toContain("¡Hola de nuevo!");
    expect(html).toContain("font-headline");
    expect(html).toContain("text-muted-foreground");
  });

  it("el subtítulo apunta al siguiente nivel de la escalera", () => {
    expect(render()).toContain("Vas camino a B2");
  });

  it("agrupa el trazado en una tarjeta bg-card con esquinas bubble", () => {
    const html = render();
    expect(html).toContain("rounded-bubble");
    expect(html).toContain("bg-card");
    expect(html).toContain("Tu ruta · Nivel B1");
    expect(html).toContain("1 de 3 escenas completadas");
  });

  it("muestra la escalera CEFR con el porcentaje del nivel en curso", () => {
    expect(render()).toContain("33%");
  });

  it("cierra con la tarjeta de recomendación y su CTA de práctica", () => {
    const html = render();
    expect(html).toContain("Recomendado para hoy");
    expect(html).toContain("Practicar ahora");
  });

  it("omite la pill de racha: el dominio aún no expone ese dato (FR-024)", () => {
    expect(render()).not.toContain("racha");
  });
});
