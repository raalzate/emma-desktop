/**
 * Freno: el juez del turno se espera ANTES de encolar el chequeo gramatical.
 *
 * El incidente: el motor local procesa UNA generación a la vez. Con la
 * gramática (360 tokens) encolada primero, el juez (80 tokens) vencía su tope
 * de 4s y caía a la red determinista EN TODOS los turnos — la arquitectura
 * «LLM juzga, código decide» instalada pero sin correr nunca, en silencio, y
 * desde fuera indistinguible de no existir (así pasó la captura de las 13:25).
 *
 * Fuente como texto (técnica de `andamiaje-espanol.test.ts`: no hay render de
 * componentes en el proyecto). Se fija el ORDEN, que es lo que alguien podría
 * invertir sin darse cuenta al refactorizar `send`.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("orden del turno en use-chat-session", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/components/chat/use-chat-session.ts"),
    "utf8",
  );

  it("el juez (observeTurn) se espera antes de encolar la gramática", () => {
    const juez = src.indexOf("await runtime.observeTurn(");
    const gramatica = src.indexOf("bufferGrammar(clean");
    expect(juez, "send debe esperar al juez del turno").toBeGreaterThan(-1);
    expect(gramatica, "send debe encolar el chequeo gramatical").toBeGreaterThan(-1);
    expect(
      juez,
      "la gramática quedó encolada ANTES que el juez: en el motor serializado el juez " +
        "vence su tope y la red determinista responde todos los turnos",
    ).toBeLessThan(gramatica);
  });

  it("el fallback del juez queda observable en dev (aviso en consola)", () => {
    expect(src).toMatch(/source === "heuristics"/);
    expect(src).toMatch(/console\.warn\(/);
  });
});
