/**
 * Copia el motor de Gemma (@litert-lm/core: ESM + WASM) y su única dependencia
 * (@litertjs/wasm-utils) a `public/litert/`, para que Next lo exporte junto a la
 * app y el modelo local no dependa de jsdelivr (#248). El ESM del paquete
 * importa `@litertjs/wasm-utils` por nombre, que el navegador no resuelve sin
 * bundler: se reescribe a una ruta relativa. Los archivos NO se versionan: se
 * generan en cada build (`/public/litert/` está en .gitignore).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Pares js/wasm que `load()` elige según soporte de relaxed SIMD. */
export const LITERT_WASM_FILES = [
  "litertlm_wasm_internal.js",
  "litertlm_wasm_internal.wasm",
  "litertlm_wasm_compat_internal.js",
  "litertlm_wasm_compat_internal.wasm",
];

const BARE_UTILS = /(['"])@litertjs\/wasm-utils\1/g;

function copyJsDir(src, dest, rewrite) {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    if (!f.endsWith(".js")) continue;
    const code = fs.readFileSync(path.join(src, f), "utf8");
    fs.writeFileSync(path.join(dest, f), rewrite ? code.replace(BARE_UTILS, "'../wasm-utils/index.js'") : code);
  }
}

export function copyLitertRuntime({ coreDir, utilsDir, destDir }) {
  const faltan = LITERT_WASM_FILES.filter((f) => !fs.existsSync(path.join(coreDir, "wasm", f)));
  if (faltan.length) throw new Error(`copy-litert-runtime: falta ${faltan.join(", ")} en ${coreDir}/wasm (@litert-lm/core)`);
  if (!fs.existsSync(path.join(utilsDir, "dist", "index.js"))) {
    throw new Error(`copy-litert-runtime: falta dist/index.js en ${utilsDir} (@litertjs/wasm-utils)`);
  }
  copyJsDir(path.join(coreDir, "dist"), path.join(destDir, "core"), true);
  copyJsDir(path.join(utilsDir, "dist"), path.join(destDir, "wasm-utils"), false);
  fs.mkdirSync(path.join(destDir, "wasm"), { recursive: true });
  for (const f of LITERT_WASM_FILES) fs.copyFileSync(path.join(coreDir, "wasm", f), path.join(destDir, "wasm", f));
}

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const coreDir = fs.realpathSync(path.join(raiz, "node_modules/@litert-lm/core"));
  // wasm-utils es dependencia de core: se resuelve desde su carpeta real (pnpm).
  const utilsDir = path.join(path.dirname(path.dirname(coreDir)), "@litertjs/wasm-utils");
  const destDir = path.join(raiz, "public/litert");
  copyLitertRuntime({ coreDir, utilsDir, destDir });
  console.log(`litert copiado a ${path.relative(raiz, destDir)}`);
}
