/**
 * Freno del Artículo 9 en el proceso main: los menús nativos (barra de la app
 * y clic derecho) también son UI, así que hablan inglés. Los tests de la UI
 * del renderer no miran `main/`; sin esto el menú de macOS quedó en español.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const MENUS = ['main/window.ts', 'main/context-menu.ts'];

/** Etiquetas literales (`label: '…'`) del archivo. */
function etiquetas(rel: string): string[] {
  const src = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
  return [...src.matchAll(/label:\s*(['"`])([^'"`]+)\1/g)].map((m) => m[2]);
}

const ESPANOL = /[áéíóúñ¿¡]|\b(con|mi|de|al|en|sin|todo|salir|vista|editar|recargar|forzar|herramientas|acercar|alejar|deshacer|rehacer|cortar|copiar|pegar|seleccionar|agregar|correcta|configuraci)\b/i;

describe('menús nativos en inglés', () => {
  for (const rel of MENUS) {
    it(`${rel} no tiene etiquetas en español`, () => {
      const lista = etiquetas(rel);
      expect(lista.length).toBeGreaterThan(0);
      expect(lista.filter((l) => ESPANOL.test(l))).toEqual([]);
    });
  }
});
