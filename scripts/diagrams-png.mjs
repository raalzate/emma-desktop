#!/usr/bin/env node
/**
 * Renderiza a PNG las fuentes Mermaid de las vistas (`docs/diagramas/*.mmd`).
 *
 *   node scripts/diagrams-png.mjs
 *
 * Los `.mmd` salen de Processflow Architect (`get_view` devuelve el Mermaid de la
 * vista); este script sólo los pasa a imagen para poder citarlos en docs, PRs o el
 * informe. NO es señal del gate: depende de `mmdc` (mermaid-cli + Chromium), que no
 * es dependencia del repo. Si falta, se dice y se sale con error.
 *
 * El ancla al código sigue viviendo en las instantáneas `.json` (`diagrams-check`);
 * el PNG es sólo la cara visible.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIR = path.join(REPO_ROOT, "docs", "diagramas");
const SALIDA = path.join(DIR, "png");
const CONFIG = path.join(SALIDA, "mermaid.config.json");

const fuentes = fs.readdirSync(DIR).filter((f) => f.endsWith(".mmd"));
if (fuentes.length === 0) {
  console.error("diagrams-png: no hay fuentes .mmd en docs/diagramas/.");
  process.exit(1);
}

try {
  execFileSync("mmdc", ["--version"], { stdio: "ignore" });
} catch {
  console.error(
    "diagrams-png: falta `mmdc`. Instalalo con `pnpm dlx @mermaid-js/mermaid-cli` o `brew install mermaid-cli`.",
  );
  process.exit(1);
}

fs.mkdirSync(SALIDA, { recursive: true });

for (const fuente of fuentes) {
  const destino = path.join(SALIDA, fuente.replace(/\.mmd$/, ".png"));
  execFileSync(
    "mmdc",
    ["-i", path.join(DIR, fuente), "-o", destino, "-b", "white", "-w", "2600", "-s", "2", "-c", CONFIG, "-q"],
    { stdio: "inherit" },
  );
  console.log(`diagrams-png: ${path.relative(REPO_ROOT, destino)}`);
}
