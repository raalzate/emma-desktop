/**
 * Ruta del runtime WASM de onnxruntime-web. Por defecto transformers.js lo pide
 * a cdn.jsdelivr.net; EMMA es local-first, así que el build lo copia a
 * `public/ort/` (ver `scripts/copy-ort-wasm.mjs`) y se sirve desde la propia app
 * (`app://-/ort/` en producción, el dev-server en desarrollo). La única descarga
 * de la primera vez queda siendo el modelo.
 */

/** Absoluta a la raíz del origen: sirve igual desde el hilo principal y desde un Worker. */
export const ORT_WASM_BASE_PATH = "/ort/";

/** Forma mínima del `env` de transformers.js que necesitamos tocar. */
interface OrtEnv {
  backends: { onnx: { wasm?: { wasmPaths?: unknown } } };
}

/** Debe correr en CADA contexto (hilo principal y Worker) antes de crear la sesión. */
export function configureOrtWasm(env: OrtEnv): void {
  const wasm = env.backends.onnx.wasm;
  if (!wasm) return;
  wasm.wasmPaths = ORT_WASM_BASE_PATH;
}
