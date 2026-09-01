/**
 * El presupuesto de turnos sale del guion, no de un número suelto.
 *
 * RC-5 del incidente del «agente torpe». Todos los escenarios tienen 3 objetivos
 * de checklist, pero los presupuestos declarados iban de 6 a 12 turnos y el
 * mínimo para calificar era 5. Es decir: la escena prometía entre 3 y 9 turnos
 * de conversación que el guion NO tenía, y `deepen` los rellenaba improvisando
 * («pedile más detalle sobre lo último que dijo»), que es exactamente donde
 * salían las líneas robóticas.
 *
 * Regla: el presupuesto es el guion más un margen de apertura y cierre. Y la
 * nota no puede exigir más turnos de los que la escena puede dar.
 */

import { describe, expect, it } from "vitest";
import { SCENE_CHECKLISTS } from "@/lib/scene-checklists";
import {
  MAX_TURNS_BY_SCENARIO,
  TURNS_AROUND_CHECKLIST,
  maxTurnsFor,
  turnsToGradeFor,
} from "../simulation-session";
import { MIN_TURNS_TO_COUNT } from "@/domain/progression/promotion-policy";

const CON_CHECKLIST = Object.keys(SCENE_CHECKLISTS);

describe("maxTurnsFor — el presupuesto lo sostiene el checklist", () => {
  it("hay escenarios con checklist que probar", () => {
    expect(CON_CHECKLIST.length).toBeGreaterThan(30);
  });

  for (const scenarioType of CON_CHECKLIST) {
    it(`${scenarioType}: no promete más conversación de la que tiene guion`, () => {
      const objetivos = SCENE_CHECKLISTS[scenarioType].length;
      expect(maxTurnsFor(scenarioType)).toBeLessThanOrEqual(objetivos + TURNS_AROUND_CHECKLIST);
    });
  }

  it("nunca baja de los objetivos: todos tienen que caber", () => {
    for (const scenarioType of CON_CHECKLIST) {
      expect(maxTurnsFor(scenarioType), scenarioType).toBeGreaterThanOrEqual(
        SCENE_CHECKLISTS[scenarioType].length,
      );
    }
  });

  it("un escenario sin checklist conserva su presupuesto declarado", () => {
    const declarado = Object.entries(MAX_TURNS_BY_SCENARIO).find(
      ([tipo]) => !SCENE_CHECKLISTS[tipo],
    );
    if (declarado) expect(maxTurnsFor(declarado[0])).toBe(declarado[1]);
  });

  it("un escenario desconocido no revienta", () => {
    expect(maxTurnsFor("no_existe")).toBeGreaterThan(0);
    expect(maxTurnsFor(null)).toBeGreaterThan(0);
  });
});

describe("turnsToGradeFor — la nota no exige lo imposible", () => {
  it("nunca pide más turnos de los que la escena permite", () => {
    for (const scenarioType of CON_CHECKLIST) {
      expect(turnsToGradeFor(scenarioType), scenarioType).toBeLessThanOrEqual(
        maxTurnsFor(scenarioType),
      );
    }
  });

  it("no relaja el mínimo general cuando la escena sí da para tanto", () => {
    const largo = CON_CHECKLIST.find(
      (s) => maxTurnsFor(s) >= MIN_TURNS_TO_COUNT,
    );
    if (largo) expect(turnsToGradeFor(largo)).toBe(MIN_TURNS_TO_COUNT);
  });

  it("una charla breve se califica por lo que dura, no por un mínimo ajeno", () => {
    const corto = CON_CHECKLIST.find((s) => maxTurnsFor(s) < MIN_TURNS_TO_COUNT);
    if (corto) expect(turnsToGradeFor(corto)).toBe(maxTurnsFor(corto));
  });
});
