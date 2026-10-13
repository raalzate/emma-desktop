import { describe, expect, it } from "vitest";
import { ORT_WASM_BASE_PATH, configureOrtWasm } from "../ort-wasm";

/** Forma mínima del `env` de transformers.js que toca la configuración. */
const fakeEnv = () => ({ backends: { onnx: { wasm: { wasmPaths: "https://cdn.jsdelivr.net/npm/x/dist/" as string | undefined } } } });

describe("configureOrtWasm", () => {
  it("apunta el runtime WASM a los archivos empaquetados con la app, no a un CDN", () => {
    const env = fakeEnv();
    configureOrtWasm(env);
    expect(env.backends.onnx.wasm.wasmPaths).toBe(ORT_WASM_BASE_PATH);
    expect(ORT_WASM_BASE_PATH).toMatch(/^\/ort\/$/);
  });

  it("es idempotente", () => {
    const env = fakeEnv();
    configureOrtWasm(env);
    configureOrtWasm(env);
    expect(env.backends.onnx.wasm.wasmPaths).toBe(ORT_WASM_BASE_PATH);
  });
});
