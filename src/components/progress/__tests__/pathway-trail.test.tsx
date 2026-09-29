import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathwayStatus } from "@/domain/pathway/pathway-status";
import type { Pathway } from "@/domain/pathway/pathway";
import type { LessonTodo } from "@/domain/lessons/lesson-todo";
import { PathwayTrail } from "@/components/progress/pathway-trail";

// Catálogo mockeado: la prueba controla la categoría sin depender del catálogo real.
vi.mock("@/domain/scenarios/scenario-catalog", () => ({
  getScenario: () => ({ category: "SOFTWARE_DEVELOPMENT" }),
}));

const pathway: Pathway = {
  cefrLevel: "B1",
  items: [
    { scenarioType: "s1", title: "Ordering Coffee", status: PathwayStatus.PASSED },
    { scenarioType: "s2", title: "At the Café", status: PathwayStatus.PENDING },
    { scenarioType: "s3", title: "Job Interview", status: PathwayStatus.PENDING },
    { scenarioType: "s4", title: "Renting a Flat", status: PathwayStatus.PENDING },
  ],
};

function render(recommendedType?: string): string {
  return renderToStaticMarkup(createElement(PathwayTrail, { pathway, recommendedType }));
}

/** Trozo de markup del nodo cuyo sr-only menciona el título dado. */
function nodoDe(html: string, titulo: string): string {
  const nodos = html.match(/<span class="[^"]*rounded-full[^"]*"[\s\S]*?<\/span><\/span>/g) ?? [];
  return nodos.find((n) => n.includes(titulo)) ?? "";
}

describe("PathwayTrail (rediseño Café sereno, FR-026)", () => {
  it("distingue los 4 estados con sus captions font-code", () => {
    const html = render("s2");
    expect(html).toContain("Completed");
    expect(html).toContain("In progress");
    expect(html).toContain("Next");
    expect(html).toContain("Locked");
    expect(html).toContain("font-code");
  });

  it("pinta la escena completada como círculo primary con check", () => {
    const nodo = nodoDe(render("s2"), "Ordering Coffee");
    expect(nodo).toContain("bg-primary");
    expect(nodo).toContain("lucide-check");
  });

  it("pinta la escena en curso con accent, halo accent-soft e icono play", () => {
    const nodo = nodoDe(render("s2"), "At the Café");
    expect(nodo).toContain("bg-accent");
    expect(nodo).toContain("ring-accent-soft");
    expect(nodo).toContain("lucide-play");
  });

  it("pinta la escena siguiente como contorno con borde neutro", () => {
    const nodo = nodoDe(render("s2"), "Job Interview");
    expect(nodo).toContain("border-border");
    expect(nodo).not.toContain("bg-secondary");
  });

  it("pinta la escena bloqueada con secondary y candado muted", () => {
    const nodo = nodoDe(render("s2"), "Renting a Flat");
    expect(nodo).toContain("bg-secondary");
    expect(nodo).toContain("text-muted-foreground");
    expect(nodo).toContain("lucide-lock");
  });

  it("dibuja punteado solo el conector hacia el nodo bloqueado", () => {
    const html = render("s2");
    // 3 conectores: s1→s2 y s2→s3 sólidos, s3→s4 (destino bloqueado) punteado.
    expect(html.match(/stroke-dasharray/g) ?? []).toHaveLength(1);
  });

  it("sin recomendación no hay «En curso»: la primera pendiente queda como siguiente", () => {
    const html = render();
    expect(html).not.toContain("In progress");
    expect(html).toContain("Next");
    expect(html).toContain("Locked");
  });
});

const origin = {
  sessionAt: 1,
  scenarioType: "s1",
  scenarioTitle: "Ordering Coffee",
};

function unrelatedTodo(): LessonTodo {
  return {
    id: "exercise:u13-fill:1",
    kind: "exercise",
    target: "u13-fill",
    titleEs: "Ejercicio",
    reasonEs: "razón",
    href: "/practice?tab=exercises&unit=13&exercise=u13-fill",
    origin,
    status: "pending",
    createdAt: 1,
  };
}

function renderWithGate(todos: LessonTodo[]): string {
  return renderToStaticMarkup(
    createElement(PathwayTrail, { pathway, recommendedType: "s2", onSelect: () => {}, todos }),
  );
}

describe("PathwayTrail — gate de lecciones pendientes (FR-006, #198)", () => {
  it("sin lecciones pendientes, todas las escenas son clicables", () => {
    const html = renderWithGate([]);
    expect(html.match(/<button/g) ?? []).toHaveLength(4);
  });

  it("con una lección pendiente sin escenario objetivo, solo la escena ya superada sigue clicable", () => {
    const html = renderWithGate([unrelatedTodo()]);
    // s1 ya está superada (repaso libre); s2/s3/s4 quedan bloqueadas.
    expect(html.match(/<button/g) ?? []).toHaveLength(1);
    expect(html).toContain("Finish your pending lessons to unlock the next scene");
    expect(html).toContain('href="/practice"');
  });

  it("la escena objetivo de una lección pendiente de tipo escenario sigue clicable", () => {
    const withScenarioTodo: LessonTodo = {
      ...unrelatedTodo(),
      id: "scenario:s3:1",
      kind: "scenario",
      target: "s3",
    };
    const html = renderWithGate([unrelatedTodo(), withScenarioTodo]);
    // s1 (superada) + s3 (objetivo de la lección pendiente) = 2 clicables.
    expect(html.match(/<button/g) ?? []).toHaveLength(2);
  });

  it("el nodo bloqueado lleva tooltip en español", () => {
    const html = renderWithGate([unrelatedTodo()]);
    expect(html).toContain("Termina tus lecciones pendientes");
  });
});
