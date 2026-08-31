/**
 * Todo escenario del catálogo debe pertenecer a alguna unidad del libro.
 *
 * El "why": la unidad de la sesión es la que aporta el bloque LANGUAGE FOCUS
 * (chunks a provocar y trampas a vigilar), el reto del paso 7 y la unidad activa
 * del contexto del tutor. Un escenario sin unidad se juega sin nada de eso, en
 * silencio: la escena funciona, pero no enseña lo que la unidad pretende.
 */

import { describe, expect, it } from "vitest";
import { ALL_SCENARIOS } from "@/lib/scenarios-data";
import { unitsForScenario } from "@/domain/curriculum/unit-catalog";

describe("cobertura escenario → unidad del libro", () => {
  it("ningún escenario del catálogo queda sin unidad", () => {
    const sinUnidad = ALL_SCENARIOS.filter((s) => unitsForScenario(s.scenarioType).length === 0).map(
      (s) => s.scenarioType,
    );
    expect(sinUnidad).toEqual([]);
  });

  it("la unidad asignada cubre el rango CEFR del escenario", () => {
    for (const s of ALL_SCENARIOS) {
      const unidades = unitsForScenario(s.scenarioType);
      expect(unidades.length, s.scenarioType).toBeGreaterThan(0);
      for (const u of unidades) {
        expect(u.number, `${s.scenarioType} → unidad ${u.number}`).toBeGreaterThanOrEqual(1);
        expect(u.number, `${s.scenarioType} → unidad ${u.number}`).toBeLessThanOrEqual(26);
      }
    }
  });
});
