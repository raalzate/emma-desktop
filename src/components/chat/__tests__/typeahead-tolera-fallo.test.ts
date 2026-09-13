/**
 * BUG: si `complete()` rechazaba (sin red, motor local ocupado), el `await`
 * dentro del setTimeout dejaba una promesa rechazada sin manejar: el fantasma
 * no aparecía y el atajo TAB parecía roto sin ninguna señal. El fallo ahora se
 * traga en silencio (el typeahead es andamiaje opcional, no puede tumbar nada).
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(
  path.join(process.cwd(), "src/components/chat/use-typeahead.ts"),
  "utf8",
);

describe("useTypeahead — tolerancia a fallo del LLM", () => {
  it("la llamada a complete() atrapa el rechazo", () => {
    expect(src).toMatch(/runtime\.complete\(context, text\)\s*\n?\s*\.catch\(\(\) => ""\)/);
  });

  it("no queda ningún await de complete() sin catch", () => {
    const awaits = src.match(/await runtime\.complete\([^)]*\)(?!\s*\.catch)/g) ?? [];
    expect(awaits).toEqual([]);
  });
});
