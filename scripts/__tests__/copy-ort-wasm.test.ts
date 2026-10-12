/**
 * El runtime WASM de onnxruntime va empaquetado (issue #247): el build lo copia
 * desde node_modules a public/ort para que Kokoro y Whisper no lo pidan a un CDN.
 * Si el script no copia el par .mjs/.wasm, la voz local fallaría sin red.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ORT_FILES, copyOrtRuntime } from "../copy-ort-wasm.mjs";

describe("copyOrtRuntime", () => {
  let base = "";
  beforeAll(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), "emma-ort-"));
  });
  afterAll(() => fs.rmSync(base, { recursive: true, force: true }));

  it("copia el par mjs/wasm al destino y lo crea si no existe", () => {
    const src = path.join(base, "src");
    const dest = path.join(base, "public", "ort");
    fs.mkdirSync(src);
    for (const f of ORT_FILES) fs.writeFileSync(path.join(src, f), `contenido ${f}`);
    copyOrtRuntime(src, dest);
    for (const f of ORT_FILES) expect(fs.readFileSync(path.join(dest, f), "utf8")).toBe(`contenido ${f}`);
  });

  it("falla con un mensaje claro si falta un archivo en el origen", () => {
    const vacio = path.join(base, "vacio");
    fs.mkdirSync(vacio);
    expect(() => copyOrtRuntime(vacio, path.join(base, "d2"))).toThrow(/ort-wasm/);
  });

  it("el origen real de transformers.js tiene los archivos esperados", () => {
    const real = path.resolve(__dirname, "../../node_modules/@huggingface/transformers/dist");
    for (const f of ORT_FILES) expect(fs.existsSync(path.join(real, f))).toBe(true);
  });
});
