/**
 * Escena lista sin espera (T14/T15 de #323). Fuente como texto: no hay render
 * del hook en el proyecto.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";

const hook = fs.readFileSync("src/components/chat/use-chat-session.ts", "utf8");
const view = fs.readFileSync("src/components/chat/chat-view.tsx", "utf8");
const home = fs.readFileSync("src/components/progress/pathway-home.tsx", "utf8");

describe("apertura de la escena", () => {
  it("toma el precálculo del mapa antes de generar", () => {
    expect(hook).toMatch(/takePrefetchedScene\(scenario\.scenarioType\)/);
  });

  it("el botón espera sólo los hechos; la narrativa llega después", () => {
    expect(hook).toMatch(/runtime\.sceneFacts\(/);
    expect(hook).toMatch(/runtime\s*\.sceneNarrative\(/);
    expect(hook).not.toMatch(/runtime\.sceneContract\(/);
  });

  it("el mapa precalcula la escena recomendada", () => {
    expect(home).toMatch(/prefetchScene\(runtime,/);
  });
});

describe("reanudación con el mismo caso", () => {
  it("lee hechos y situación guardados y los usa en el system y el contrato", () => {
    expect(hook).toMatch(/readStoredScene\(restore\)/);
    expect(hook).toMatch(/sceneFacts: stored\.sceneFacts \?\? undefined/);
    expect(hook).toMatch(/facts: stored\.sceneFacts \?\? situationR\?\.framingDescription/);
  });

  it("el snapshot guarda hechos y situación, y la vista los persiste", () => {
    expect(hook).toMatch(/sceneFacts: contract\?\.facts/);
    expect(hook).toMatch(/situationId: situation\?\.id/);
    expect(view).toMatch(/sceneFacts: snap\.sceneFacts/);
    expect(view).toMatch(/situationId: snap\.situationId/);
  });
});
