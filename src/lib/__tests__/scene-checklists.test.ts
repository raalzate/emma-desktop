/**
 * Cobertura e integridad de los objetivos de escena: sin checklist la escena no
 * tiene rumbo y termina por conteo de turnos, no por haber practicado.
 */

import { describe, expect, it } from "vitest";
import { SCENE_CHECKLISTS } from "@/lib/scene-checklists";
import { ALL_SCENARIOS } from "@/lib/scenarios-data";
import { createSceneState } from "@/domain/chat/scene-state";

describe("SCENE_CHECKLISTS", () => {
  it("cubre todos los escenarios del catálogo", () => {
    const sinChecklist = ALL_SCENARIOS.filter((s) => !SCENE_CHECKLISTS[s.scenarioType]).map(
      (s) => s.scenarioType,
    );
    expect(sinChecklist).toEqual([]);
  });

  it("no define checklists para escenarios inexistentes", () => {
    const tipos = new Set(ALL_SCENARIOS.map((s) => s.scenarioType));
    const huerfanos = Object.keys(SCENE_CHECKLISTS).filter((k) => !tipos.has(k));
    expect(huerfanos).toEqual([]);
  });

  // El tope era 4 cuando ninguna escena podía sostener más. Las de fondo
  // (entrevista, postmortem, code review, design review) llegan a 6 desde que
  // el presupuesto se deriva del guion: son escenas de 12 turnos y sin objetivos
  // suficientes esos turnos se llenaban improvisando. Por arriba sigue habiendo
  // techo: un checklist de diez temas es un interrogatorio, no una conversación.
  it("da entre 2 y 6 objetivos por escenario, con ids únicos", () => {
    for (const [tipo, items] of Object.entries(SCENE_CHECKLISTS)) {
      expect(items.length, tipo).toBeGreaterThanOrEqual(2);
      expect(items.length, tipo).toBeLessThanOrEqual(6);
      expect(new Set(items.map((i) => i.id)).size, tipo).toBe(items.length);
    }
  });

  it("describe qué preguntar en cada objetivo", () => {
    for (const [tipo, items] of Object.entries(SCENE_CHECKLISTS)) {
      for (const item of items) {
        expect(item.ask.trim().length, `${tipo}/${item.id}`).toBeGreaterThan(5);
        expect(item.id.trim(), tipo).not.toBe("");
      }
    }
  });

  it("los marcadores no son regex vacías ni globales (el flag g rompe .test repetido)", () => {
    for (const [tipo, items] of Object.entries(SCENE_CHECKLISTS)) {
      for (const item of items) {
        expect(item.reaskMarkers.source.length, `${tipo}/${item.id}`).toBeGreaterThan(2);
        expect(item.reaskMarkers.flags, `${tipo}/${item.id}`).not.toContain("g");
        expect(item.answerMarkers?.flags ?? "", `${tipo}/${item.id}`).not.toContain("g");
      }
    }
  });

  it("cada escenario del catálogo arranca con estado de escena real", () => {
    for (const s of ALL_SCENARIOS) {
      expect(createSceneState(s.scenarioType), s.scenarioType).not.toBeNull();
    }
  });
});
