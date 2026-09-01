import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/nav/app-shell";

// Render en servidor (sin DOM) vía createElement: el tsconfig de Next usa
// `jsx: preserve` y vitest no transforma JSX en los tests.
// El pathname se controla por test mockeando next/navigation.
const ruta = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => ruta.pathname,
}));

/** Devuelve la etiqueta de apertura del <a> con ese href exacto (tolera slash final). */
function anclaDe(html: string, href: string): string {
  const anclas = html.match(/<a\b[^>]*>/g) ?? [];
  return (
    anclas.find((a) => a.includes(`href="${href}"`) || a.includes(`href="${href}/"`)) ?? ""
  );
}

function render(extra?: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(
    createElement(AppShell, { extra, children: createElement("p", null, "contenido") }),
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    ruta.pathname = "/";
  });

  it("muestra los cuatro enlaces de navegación principal", () => {
    const html = render();
    expect(anclaDe(html, "/")).not.toBe("");
    expect(anclaDe(html, "/practice")).not.toBe("");
    expect(anclaDe(html, "/progress")).not.toBe("");
    expect(anclaDe(html, "/settings")).not.toBe("");
    expect(html).toContain("Tu ruta");
    expect(html).toContain("Práctica");
    expect(html).toContain("Progreso");
    expect(html).toContain("Ajustes");
  });

  it("marca como activo el enlace de la ruta actual", () => {
    ruta.pathname = "/practice";
    const html = render();
    expect(anclaDe(html, "/practice")).toContain("bg-primary-soft");
    expect(anclaDe(html, "/progress")).not.toContain("bg-primary-soft");
    expect(anclaDe(html, "/")).not.toContain("bg-primary-soft");
  });

  it("marca «Tu ruta» como activa cuando se navega por /chat", () => {
    ruta.pathname = "/chat";
    const html = render();
    expect(anclaDe(html, "/")).toContain("bg-primary-soft");
    expect(anclaDe(html, "/practice")).not.toContain("bg-primary-soft");
  });

  it("incluye el sello local-first", () => {
    const html = render();
    expect(html).toContain("100% local");
  });

  it("renderiza la ranura extra cuando se provee", () => {
    const html = render(createElement("div", { id: "ranura-extra" }, "sesiones"));
    expect(html).toContain('id="ranura-extra"');
    expect(html).toContain("sesiones");
  });

  it("renderiza el contenido de la página en el main", () => {
    const html = render();
    expect(html).toContain("<p>contenido</p>");
    expect(html).toContain("<main");
  });
});
