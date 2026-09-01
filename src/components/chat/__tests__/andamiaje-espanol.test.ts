/**
 * Freno del Artículo 9 en la dirección contraria a la regla ESCENA del lint:
 * el contenido de escena va en inglés, pero el ANDAMIAJE de producto (títulos de
 * sección, botones, mensajes de sistema) se queda en español. Al pasar la escena
 * a inglés (issue #106) es fácil arrastrar de más; esta prueba lo impide.
 *
 * Lee el fuente como texto porque no hay render de componentes en el proyecto:
 * la aserción es sobre el copy literal, que es justo lo que se quiere fijar.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const leer = (relativo: string) =>
  fs.readFileSync(path.join(process.cwd(), "src/components/chat", relativo), "utf8");

describe("andamiaje de producto en español (Artículo 9)", () => {
  it("la antesala mantiene sus títulos, botón y ayudas en español", () => {
    const src = leer("scene-intro.tsx");
    for (const copy of [
      "Tu próxima escena",
      "Hablarás con",
      "Imagina la escena",
      "Tu objetivo en la escena (en inglés)",
      "Creando tu escena…",
      "Estoy listo, comenzar",
      "Conversación en inglés",
    ]) {
      expect(src, `falta el andamiaje en español: ${copy}`).toContain(copy);
    }
  });

  it("la narración de escena es contenido en inglés; su único control va en español", () => {
    const src = leer("scene-narration.tsx");
    // Lo que se narra es la ficción: en inglés, sin andamiaje traducido dentro.
    expect(src).not.toMatch(/"[^"]*\b(Escenario|Hablas con|Tu objetivo)\b[^"]*"/);
    // El control que sí es producto (saltar la animación) se queda en español.
    expect(src).toContain("Saltar la introducción");
  });

  it("la cabecera y el cierre del chat siguen en español", () => {
    expect(leer("chat-header.tsx")).toContain("Con ");
    expect(leer("chat-header.tsx")).toContain("Terminar antes y ver tu lección");
    expect(leer("chat-pane.tsx")).toContain("Finalizar y ver lección");
    expect(leer("chat-pane.tsx")).toContain("Ver tu lección");
  });
});
