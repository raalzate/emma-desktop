/**
 * Ajustes de la prueba en la app (2026-09-29, #195): My lessons va en una
 * tarjeta como Today, las subpáginas vuelven a Práctica (no a la ruta) y el
 * laboratorio de sonidos se organiza en pestañas con la guía de shadowing
 * como ayuda plegable, no como lista siempre abierta.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (f: string) => readFileSync(f, "utf8");
const practicePage = read("src/app/practice/page.tsx");
const pageHeader = read("src/components/nav/page-header.tsx");
const routeShell = read("src/components/practice/practice-route-shell.tsx");
const lab = read("src/components/practice/minimal-pair-lab.tsx");

describe("/practice — My lessons en tarjeta, como Today", () => {
  it("la sección de My lessons usa la misma superficie que Today", () => {
    const seccion = practicePage.slice(practicePage.indexOf('aria-labelledby="mis-lecciones"') - 120);
    expect(seccion).toMatch(/<section[^>]*bg-card[^>]*aria-labelledby="mis-lecciones"|aria-labelledby="mis-lecciones"[^>]*bg-card/);
  });
});

describe("subpáginas de Práctica — la cabecera vuelve a Practice", () => {
  it("PageHeader acepta un destino de vuelta propio", () => {
    expect(pageHeader).toMatch(/back\?:/);
  });

  it("las subpáginas vuelven a /practice, no a la ruta", () => {
    expect(routeShell).toMatch(/href:\s*"\/practice"/);
    expect(routeShell).toContain('label: "Practice"');
  });
});

describe("laboratorio de sonidos — pestañas y ayuda plegable", () => {
  it("separa pares mínimos y shadowing en pestañas", () => {
    expect(lab).toContain("<Tabs");
    expect(lab).toContain("Minimal pairs");
    expect(lab).toMatch(/TabsTrigger value="shadowing"/);
  });

  it("los seis pasos del shadowing quedan en una ayuda plegable, cerrada por defecto", () => {
    expect(lab).toContain("<details");
    expect(lab).toContain("How shadowing works");
    const ayuda = lab.slice(lab.indexOf("<details"), lab.indexOf("</details>"));
    expect(ayuda).toContain("SHADOWING_PROTOCOL");
    expect(ayuda).not.toMatch(/<details[^>]*\bopen\b/);
  });
});
