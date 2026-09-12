/**
 * La vitrina se publica ENTERA o el workflow falla.
 *
 * Incidente: el paso de publicación enumeraba archivos
 * (`git add index.html styles.css img .nojekyll`). Al agregar
 * `site/ultima-version.js`, el sitio salió publicado sin él: la página pedía un
 * script que daba 404 y el workflow terminó en verde, así que nadie se enteró
 * hasta abrirla. Esta prueba fija las dos condiciones del arreglo: se publica el
 * directorio completo y se compara lo publicado contra `site/`.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const WORKFLOW = path.join(RAIZ, ".github/workflows/pages.yml");

describe("workflow de Pages", () => {
  const yml = fs.readFileSync(WORKFLOW, "utf8");

  it("publica el directorio completo, no una lista de nombres", () => {
    const enumeraArchivos = /git add\s+(?!--all|-A|\.)\S+/.test(yml);
    expect(enumeraArchivos, "enumerar archivos deja fuera los nuevos sin fallar").toBe(false);
  });

  it("compara lo publicado contra site/ y corta si falta algo", () => {
    expect(yml).toContain("PAGES ROJO");
    expect(yml).toMatch(/exit 1/);
  });

  it("cada archivo referenciado por la página existe en site/", () => {
    const sitio = path.join(RAIZ, "site");
    const html = fs.readFileSync(path.join(sitio, "index.html"), "utf8");
    const referencias = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
      .map((m) => m[1])
      .filter((r) => !/^(https?:)?\/\//.test(r));

    const faltantes = referencias.filter((r) => !fs.existsSync(path.join(sitio, r)));
    expect(faltantes).toEqual([]);
  });
});
