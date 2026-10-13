/**
 * #248: el motor de Gemma no se pide a jsdelivr. `Engine.create` carga el WASM
 * desde `LiteRtLm.DEFAULT_WASM_PATH` (un CDN) salvo que antes se llame a
 * `loadLiteRtLm` con otra ruta: estas pruebas fijan que el módulo y el WASM
 * salen de la app.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const leer = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("LiteRT-LM empaquetado", () => {
  const motor = leer("src/lib/ai/litert-engine.ts");

  it("no importa nada desde un CDN", () => {
    expect(motor).not.toMatch(/cdn\.jsdelivr\.net|unpkg\.com/);
  });

  it("importa el ESM servido por la app y fija la ruta local del WASM", () => {
    expect(motor).toMatch(/["']\/litert\/core\/index\.js["']/);
    expect(motor).toMatch(/loadLiteRtLm\(\s*LITERT_WASM_PATH\s*\)/);
    expect(motor).toMatch(/LITERT_WASM_PATH\s*=\s*["']\/litert\/wasm\/?["']/);
  });

  it("el build copia el runtime a public/litert y esa carpeta no se versiona", () => {
    const pkg = JSON.parse(leer("package.json")) as { scripts: Record<string, string> };
    expect(pkg.scripts["next-build"]).toMatch(/copy-litert-runtime/);
    expect(pkg.scripts["next-dev"]).toMatch(/copy-litert-runtime/);
    expect(pkg.scripts["dev"]).toMatch(/copy-litert-runtime/);
    expect(leer(".gitignore")).toMatch(/^\/public\/litert\/?$/m);
  });
});
