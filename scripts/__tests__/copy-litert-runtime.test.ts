/**
 * El motor de Gemma (@litert-lm/core) va empaquetado (issue #248): el build copia
 * su ESM y su WASM a public/litert para que el modelo local arranque sin CDN.
 * El ESM del paquete importa `@litertjs/wasm-utils` por nombre, que el navegador
 * no resuelve: la copia lo reescribe a una ruta relativa.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { LITERT_WASM_FILES, copyLitertRuntime } from "../copy-litert-runtime.mjs";

function paqueteFalso(base: string) {
  const core = path.join(base, "core");
  const utils = path.join(base, "utils");
  fs.mkdirSync(path.join(core, "dist"), { recursive: true });
  fs.mkdirSync(path.join(core, "wasm"), { recursive: true });
  fs.mkdirSync(path.join(utils, "dist"), { recursive: true });
  fs.writeFileSync(path.join(core, "dist", "index.js"), "export * from './load.js';\n");
  fs.writeFileSync(
    path.join(core, "dist", "load.js"),
    "import { createWasmLib } from '@litertjs/wasm-utils';\nexport const x = createWasmLib;\n",
  );
  for (const f of LITERT_WASM_FILES) fs.writeFileSync(path.join(core, "wasm", f), `wasm ${f}`);
  fs.writeFileSync(path.join(utils, "dist", "index.js"), "export function createWasmLib() {}\n");
  return { core, utils };
}

describe("copyLitertRuntime", () => {
  let base = "";
  beforeAll(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), "emma-litert-"));
  });
  afterAll(() => fs.rmSync(base, { recursive: true, force: true }));

  it("copia el ESM, el WASM y wasm-utils, y reescribe el import por nombre a ruta relativa", () => {
    const { core, utils } = paqueteFalso(path.join(base, "a"));
    const dest = path.join(base, "a", "public", "litert");
    copyLitertRuntime({ coreDir: core, utilsDir: utils, destDir: dest });

    const load = fs.readFileSync(path.join(dest, "core", "load.js"), "utf8");
    expect(load).not.toMatch(/'@litertjs\/wasm-utils'/);
    expect(load).toMatch(/from '\.\.\/wasm-utils\/index\.js'/);
    expect(fs.existsSync(path.join(dest, "core", "index.js"))).toBe(true);
    expect(fs.existsSync(path.join(dest, "wasm-utils", "index.js"))).toBe(true);
    for (const f of LITERT_WASM_FILES) expect(fs.existsSync(path.join(dest, "wasm", f))).toBe(true);
  });

  it("falla con un mensaje claro si falta el WASM", () => {
    const { core, utils } = paqueteFalso(path.join(base, "b"));
    fs.rmSync(path.join(core, "wasm"), { recursive: true });
    expect(() =>
      copyLitertRuntime({ coreDir: core, utilsDir: utils, destDir: path.join(base, "b", "d") }),
    ).toThrow(/litert/);
  });

  it("el paquete real instalado trae los archivos esperados", () => {
    const real = path.resolve(__dirname, "../../node_modules/@litert-lm/core/wasm");
    for (const f of LITERT_WASM_FILES) expect(fs.existsSync(path.join(real, f))).toBe(true);
  });
});
