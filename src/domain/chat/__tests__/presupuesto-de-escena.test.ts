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
import { SCENE_CHECKLISTS, SCENE_DEPTH, MIN_ITEMS_FOR_DEPTH } from "@/lib/scene-checklists";
import {
  MAX_TURNS_BY_SCENARIO,
  TURNS_AROUND_CHECKLIST,
  depthFor,
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
      expect(maxTurnsFor(scenarioType)).toBeLessThanOrEqual(
        objetivos * depthFor(scenarioType) + TURNS_AROUND_CHECKLIST,
      );
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

/**
 * La profundidad (dos turnos por objetivo: preguntar y repreguntar por el
 * detalle) es lo que sostiene una entrevista o un postmortem de 12 turnos. Y es
 * exactamente la puerta por la que volvería el relleno si se pudiera declarar
 * sobre un guion de tres ítems: el freno la ata a tener contenido de verdad.
 */
describe("depthFor — la profundidad exige guion que la sostenga", () => {
  it("por defecto un objetivo se conversa en un turno", () => {
    expect(depthFor("morning_greeting")).toBe(1);
    expect(depthFor("no_existe")).toBe(1);
  });

  it("ningún escenario declara profundidad sin objetivos suficientes", () => {
    for (const [scenarioType, depth] of Object.entries(SCENE_DEPTH)) {
      if (depth <= 1) continue;
      expect(SCENE_CHECKLISTS[scenarioType], `${scenarioType} declara profundidad sin checklist`)
        .toBeDefined();
      expect(
        SCENE_CHECKLISTS[scenarioType].length,
        `${scenarioType} declara profundidad ${depth} con sólo ${SCENE_CHECKLISTS[scenarioType].length} objetivos`,
      ).toBeGreaterThanOrEqual(MIN_ITEMS_FOR_DEPTH);
    }
  });

  it("los escenarios profundos conservan su presupuesto largo", () => {
    for (const scenarioType of ["code_review", "tech_interview", "incident_postmortem", "design_review"]) {
      expect(maxTurnsFor(scenarioType), scenarioType).toBe(MAX_TURNS_BY_SCENARIO[scenarioType]);
    }
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
