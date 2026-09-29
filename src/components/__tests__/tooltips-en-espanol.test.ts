/**
 * Freno del Artículo 9 (v1.6.0), segunda mitad: la UI habla inglés y el
 * andamiaje en español vive en los tooltips. Para que exista ese andamiaje,
 * TODO botón lleva tooltip: `title="…"` en el propio elemento, o un
 * `<TooltipTrigger asChild>` justo antes (Tooltip Radix con `TooltipContent`).
 *
 * Escanea el fuente como texto: cada tag de apertura `<Button`, `<button`,
 * `<TabsTrigger` fuera de `src/components/ui/` (primitivos) y de pruebas.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const CARPETAS_UI = ["src/components", "src/app", "src/interface"];
const PRIMITIVOS = "src/components/ui";

function listarTsx(dir: string): string[] {
  const abs = path.join(RAIZ, dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || rel === PRIMITIVOS) continue;
      out.push(...listarTsx(rel));
    } else if (entry.name.endsWith(".tsx")) {
      out.push(rel);
    }
  }
  return out;
}

const conservarLineas = (s: string) => s.replace(/[^\n]/g, " ");

function botonesSinTooltip(rel: string): string[] {
  const src = fs
    .readFileSync(path.join(RAIZ, rel), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, conservarLineas);
  const hallazgos: string[] = [];
  // `(?:[^>]|=>)` deja pasar el `=>` de un `onClick={() => …}` sin cerrar el tag.
  for (const m of src.matchAll(/<(Button|button|TabsTrigger)\b((?:[^>]|=>)*?)>/g)) {
    const attrs = m[2];
    const antes = src.slice(Math.max(0, m.index - 200), m.index);
    const conTitle = /\btitle=/.test(attrs);
    const conTooltipRadix = /<TooltipTrigger[^>]*>\s*$/.test(antes);
    if (conTitle || conTooltipRadix) continue;
    const linea = src.slice(0, m.index).split("\n").length;
    hallazgos.push(`${rel}:${linea}: <${m[1]}>`);
  }
  return hallazgos;
}

describe("todo botón lleva tooltip en español (Artículo 9)", () => {
  it("ningún <Button>, <button> ni <TabsTrigger> queda sin title ni TooltipTrigger", () => {
    const hallazgos = CARPETAS_UI.flatMap(listarTsx).flatMap(botonesSinTooltip);
    expect(hallazgos, `botones sin tooltip:\n${hallazgos.join("\n")}`).toEqual([]);
  });
});
