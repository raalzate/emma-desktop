/**
 * FR-014 (rediseño «Café sereno»): la escena se presenta como franja ámbar
 * suave (bg-accent-soft) con tag mono «ESCENA» y texto en itálica, tanto en la
 * antesala (scene-intro) como en la narración dentro de la sesión
 * (scene-narration). La narración sigue siendo contenido en inglés.
 *
 * Aserción sobre el fuente (patrón de andamiaje-espanol.test.ts): lo que se
 * fija es la clase/copy literal.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const leer = (relativo: string) =>
  fs.readFileSync(path.join(process.cwd(), "src/components/chat", relativo), "utf8");

describe("franja de escena (FR-014)", () => {
  for (const archivo of ["scene-intro.tsx", "scene-narration.tsx"]) {
    it(`${archivo} pinta la banda ámbar suave con tag mono «ESCENA» e itálica`, () => {
      const src = leer(archivo);
      expect(src, "falta el fondo ámbar suave").toContain("bg-accent-soft");
      expect(src, "falta el tag ESCENA").toContain("ESCENA");
      expect(src, "el tag debe ir en mono").toContain("font-code");
      expect(src, "el texto de escena va en itálica").toContain("italic");
    });
  }

  it("los iconos de misión usan el token scaffold, no emerald crudo", () => {
    expect(leer("scene-intro.tsx")).not.toContain("emerald");
    expect(leer("scene-narration.tsx")).not.toContain("emerald");
  });
});
