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

  it("el banner de escena y la cabecera del chat siguen en español", () => {
    expect(leer("scene-context.tsx")).toContain("Escenario");
    expect(leer("scene-context.tsx")).toContain("Hablas con:");
    expect(leer("chat-header.tsx")).toContain("Con ");
  });
});
