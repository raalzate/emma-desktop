/**
 * Freno (#383): todo canal que el preload invoca tiene su `ipcMain.handle`.
 *
 * Desde #96 (spec #137) `main/ipc.ts` importaba las funciones de actualización
 * pero nunca registró sus canales: «Check for updates», descargar e instalar
 * fallaban con «No handler registered» en la app empaquetada, y ninguna
 * prueba lo veía porque cada lado, por separado, estaba bien.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

function tsFiles(dir: string): string[] {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : tsFiles(rel);
    return e.name.endsWith(".ts") ? [rel] : [];
  });
}

const channels = (src: string, re: RegExp) => new Set([...src.matchAll(re)].map((m) => m[1]));

describe("canales IPC", () => {
  it("cada ipcRenderer.invoke del preload tiene un ipcMain.handle en el main", () => {
    const invoked = channels(read("preload.ts"), /ipcRenderer\.invoke\('([^']+)'/g);
    const mainSrc = [...tsFiles("main"), "main.ts"].map(read).join("\n");
    const handled = channels(mainSrc, /ipcMain\.handle\('([^']+)'/g);
    const missing = [...invoked].filter((c) => !handled.has(c));
    expect(invoked.size).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
});
