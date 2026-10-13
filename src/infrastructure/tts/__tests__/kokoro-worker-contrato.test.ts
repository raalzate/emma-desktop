/**
 * INCIDENTE (#245): Kokoro en WebGPU, con Gemma cargada en la misma GPU, tardaba
 * 2-16 s al primer sonido y la app llegó a cerrarse. Estas pruebas fijan las dos
 * decisiones que lo arreglan y que un compilador no ve: el modelo corre en WASM
 * dentro de un worker, y el worker se declara de la forma que webpack empaqueta.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const leer = (file: string) => fs.readFileSync(path.join(process.cwd(), "src/infrastructure/tts", file), "utf8");

describe("Kokoro local", () => {
  it("el worker carga el modelo con device wasm y nunca con webgpu", () => {
    const src = leer("kokoro.worker.ts");
    expect(src).toMatch(/device:\s*"wasm"/);
    expect(src).not.toMatch(/device:\s*"webgpu"|navigator\.gpu/);
  });

  it("el renderer crea el worker con new URL literal (lo que webpack empaqueta en el export estático)", () => {
    expect(leer("kokoro-tts.ts")).toMatch(/new Worker\(\s*new URL\("\.\/kokoro\.worker\.ts", import\.meta\.url\)/);
  });

  it("el renderer ya no importa kokoro-js: el runtime pesado vive solo en el worker", () => {
    expect(leer("kokoro-tts.ts")).not.toMatch(/from "kokoro-js"|import\("kokoro-js"\)/);
  });
});
