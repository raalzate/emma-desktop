/**
 * Freno (incidente 2026-11-24, «se queda pensando»): el motor local procesa UNA
 * generación a la vez. Un caso de uso que pone tope de reloj a una llamada al
 * LLM con `Promise.race` y NO la cancela deja la generación corriendo: el
 * resultado se descarta pero el motor sigue ocupado, y todo lo que viene
 * después (el reintento del turno, el juez, la próxima respuesta) espera en la
 * cola. Ya pasó con el juez de escena, el observador y el turno de chat.
 *
 * Regla: en `src/application`, todo archivo que corre un tope de reloj sobre una
 * llamada al LLM crea un AbortController, pasa su `signal` a la llamada y lo
 * aborta. Escaneo de fuente (técnica de `juez-de-escena-cableado.test.ts`):
 * grueso a propósito, para que muerda también en el próximo caso de uso.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const APP = path.join(process.cwd(), "src/application");

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : sources(full);
    return e.name.endsWith(".ts") ? [full] : [];
  });
}

/** Sin comentarios: un comentario que nombra `.abort()` no cancela nada. */
function code(file: string): string {
  return fs
    .readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const RACES = /Promise\.race\(|withTimeout\(/;
const LLM_CALL = /\bllm\(|\.llm\(/;

describe("todo tope de reloj sobre el LLM cancela la generación", () => {
  const candidates = sources(APP).filter((f) => {
    const c = code(f);
    return RACES.test(c) && LLM_CALL.test(c);
  });

  it("el escaneo encuentra los casos de uso con tope (si no, el freno está muerto)", () => {
    expect(candidates.length).toBeGreaterThan(2);
  });

  it.each(candidates.map((f) => [path.relative(process.cwd(), f), f]))(
    "%s crea un AbortController, pasa su signal y lo aborta",
    (_rel, file) => {
      const c = code(file);
      expect(c, "falta `new AbortController()`").toMatch(/new AbortController\(\)/);
      expect(c, "falta `.abort()` al vencer el tope").toMatch(/\.abort\(\)/);
      expect(c, "la llamada al LLM no recibe `signal`").toMatch(/signal:\s*\w+(\.signal)?/);
    },
  );
});
