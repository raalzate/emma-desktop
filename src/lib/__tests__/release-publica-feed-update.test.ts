/**
 * Freno (#377): el release DEBE publicar el feed de electron-updater.
 *
 * `main/services/auto-update.ts` busca la versión nueva leyendo `latest.yml`
 * (Windows), `latest-linux.yml` y `latest-mac.yml` del release de GitHub. Hasta
 * la v0.13.1 el workflow subía sólo los instaladores: cada chequeo terminaba en
 * error y la app nunca se actualizó sola. Sin los `.blockmap`, además, cada
 * actualización baja el instalador entero.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const workflow = fs.readFileSync(path.join(process.cwd(), ".github/workflows/release-build.yml"), "utf8");

describe("release-build.yml publica el feed de actualización", () => {
  it("el artefacto de cada plataforma incluye los latest*.yml y los .blockmap", () => {
    expect(workflow).toMatch(/^\s+dist\/latest\*\.yml$/m);
    expect(workflow).toMatch(/^\s+dist\/\*\.blockmap$/m);
  });

  it("el release sube los latest*.yml y los .blockmap", () => {
    expect(workflow).toMatch(/^\s+installers\/latest\*\.yml$/m);
    expect(workflow).toMatch(/^\s+installers\/\*\.blockmap$/m);
  });

  // #381: el nombre por defecto del NSIS es «EMMA Setup X.exe». latest.yml lo
  // escribe con guiones y GitHub lo sube con puntos: la descarga del update
  // en Windows daba 404. Sin espacios, el archivo se llama igual en los dos.
  it("el instalador de Windows se nombra sin espacios, igual que en latest.yml", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    const name: unknown = pkg.build?.nsis?.artifactName;
    expect(name).toBe("${productName}-Setup-${version}.${ext}");
  });
});
