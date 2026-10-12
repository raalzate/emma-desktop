/**
 * Copia el runtime WASM de onnxruntime-web (el que trae transformers.js, de la
 * misma versión que lo usa) a `public/ort/`, para que Next lo exporte junto a la
 * app y no se pida a un CDN. Los binarios NO se versionan: se generan en cada
 * build (`/public/ort/` está en .gitignore).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Par que transformers.js pide con `wasmPaths` (build con soporte jsep). */
export const ORT_FILES = ["ort-wasm-simd-threaded.jsep.mjs", "ort-wasm-simd-threaded.jsep.wasm"];

export function copyOrtRuntime(srcDir, destDir) {
  for (const f of ORT_FILES) {
    if (!fs.existsSync(path.join(srcDir, f))) {
      throw new Error(`copy-ort-wasm: falta ${f} en ${srcDir} (ort-wasm de @huggingface/transformers)`);
    }
  }
  fs.mkdirSync(destDir, { recursive: true });
  for (const f of ORT_FILES) fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
}

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const src = path.join(raiz, "node_modules/@huggingface/transformers/dist");
  const dest = path.join(raiz, "public/ort");
  copyOrtRuntime(src, dest);
  console.log(`ort-wasm copiado a ${path.relative(raiz, dest)}`);
}
