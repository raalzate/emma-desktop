/**
 * #247: el WASM de onnxruntime sale de la app, no de jsdelivr. El `env` es
 * propio de cada contexto (hilo principal y Worker), así que cada punto de
 * entrada que crea una sesión de transformers.js debe configurarlo. Un
 * compilador no ve que falte: estas pruebas lo fijan.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const leer = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("runtime WASM empaquetado", () => {
  it.each([
    "src/infrastructure/tts/kokoro.worker.ts",
    "src/infrastructure/audio/whisper-transcribe.ts",
  ])("%s configura configureOrtWasm antes de crear la sesión", (file) => {
    expect(leer(file)).toMatch(/configureOrtWasm\(/);
  });

  it("el build copia el runtime a public/ort y esa carpeta no se versiona", () => {
    const pkg = JSON.parse(leer("package.json")) as { scripts: Record<string, string> };
    expect(pkg.scripts["next-build"]).toMatch(/copy-ort-wasm/);
    expect(pkg.scripts["next-dev"]).toMatch(/copy-ort-wasm/);
    expect(leer(".gitignore")).toMatch(/^\/public\/ort\/?$/m);
  });
});
