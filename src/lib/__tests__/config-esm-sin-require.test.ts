/**
 * Freno: un config ESM del raíz no puede llamar `require()`.
 *
 * El incidente: `tailwind.config.ts` era ESM (import + export default) pero
 * cargaba los plugins con `require()`. Node 25 lo carga como ESM, donde
 * `require` no existe, y `next dev` moría con `ReferenceError: require is not
 * defined` — SOLO en dev, en la primera recompilación de Tailwind. `pnpm build`
 * y todo el gate pasaban en verde, porque Next resuelve la config por otro
 * camino en build.
 *
 * No se puede reproducir el crash fuera de `next dev` (se intentó: ni
 * `import()` ni `require()` desde CJS fallan sueltos), así que el freno es
 * estático: detectar la MEZCLA, que es la causa, no el síntoma.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/** Configs del raíz que las herramientas cargan con Node directamente. */
const CONFIGS = [
  "tailwind.config.ts",
  "next.config.ts",
  "postcss.config.mjs",
  "vitest.config.ts",
];

/** ¿El fuente es ESM? (usa import/export de módulo). */
const esEsm = (src: string) => /^\s*(?:import|export)\s/m.test(src);

/** Llamadas `require(` reales (no la palabra en un comentario). */
const llamaRequire = (src: string) =>
  src
    .split("\n")
    .filter((l) => !/^\s*(?:\/\/|\*|\/\*)/.test(l))
    .some((l) => /\brequire\s*\(/.test(l));

describe("configs del raíz: ESM y require() no se mezclan", () => {
  for (const config of CONFIGS) {
    const ruta = path.join(process.cwd(), config);
    if (!fs.existsSync(ruta)) continue;
    it(`${config} no mezcla ESM con require()`, () => {
      const src = fs.readFileSync(ruta, "utf8");
      if (!esEsm(src)) return;
      expect(
        llamaRequire(src),
        `${config} es ESM y llama require(): Node 25 lo carga como ESM y next dev muere ` +
          "con «ReferenceError: require is not defined». Importá el módulo en su lugar.",
      ).toBe(false);
    });
  }

  // Prueba de vida del freno: el contenido EXACTO que rompió dev debe caer.
  it("el detector muerde sobre la versión que causó el incidente", () => {
    const roto =
      "import type { Config } from 'tailwindcss';\n" +
      "export default {\n" +
      "  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],\n" +
      "} satisfies Config;\n";
    expect(esEsm(roto) && llamaRequire(roto)).toBe(true);
  });
});
