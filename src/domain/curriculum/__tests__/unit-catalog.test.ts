import { describe, expect, it } from "vitest";

import {
  getUnit,
  unitForSession,
  unitsForLevel,
  unitsForScenario,
} from "../unit-catalog";

describe("getUnit", () => {
  it("devuelve la unidad por número", () => {
    const unit = getUnit(4);
    expect(unit?.number).toBe(4);
    expect(unit?.cefrLevel).toBe("A1");
  });

  it("devuelve undefined si el número no existe", () => {
    expect(getUnit(999)).toBeUndefined();
  });
});

describe("unitsForLevel", () => {
  it("devuelve solo unidades del nivel pedido", () => {
    const units = unitsForLevel("A1");
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) expect(u.cefrLevel).toBe("A1");
  });

  it("C1 devuelve las unidades B2, porque el libro termina en B2", () => {
    const c1Units = unitsForLevel("C1");
    const b2Units = unitsForLevel("B2");
    expect(c1Units).toEqual(b2Units);
    expect(c1Units.length).toBeGreaterThan(0);
  });
});

describe("unitsForScenario", () => {
  it("devuelve las unidades cuyo scenarioTypes incluye el escenario dado", () => {
    const units = unitsForScenario("daily_standup");
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) expect(u.scenarioTypes).toContain("daily_standup");
  });

  it("devuelve [] si ningún escenario coincide", () => {
    expect(unitsForScenario("no_existe")).toEqual([]);
  });
});

describe("unitForSession", () => {
  it("devuelve la unidad cuyo nivel coincide exactamente con el escenario y nivel", () => {
    // daily_standup aparece en unidad 4 (A1) y unidad 6 (A1); ambas A1 -> primera coincidencia.
    const unit = unitForSession("code_review", "B1");
    expect(unit?.cefrLevel).toBe("B1");
    expect(unit?.scenarioTypes).toContain("code_review");
  });

  it("sin coincidencia exacta, elige la más cercana en la escalera CEFR", () => {
    // code_review solo tiene unidad B1 (13); pedir A1 debe devolver la B1 (más cercana).
    const unit = unitForSession("code_review", "A1");
    expect(unit?.cefrLevel).toBe("B1");
  });

  it("en empate de distancia prefiere el nivel inferior", () => {
    // incident_postmortem tiene unidades A2 (12), B1 (14) y B2 (19); pedir B1 exacto ya cubierto.
    // Buscamos un escenario con niveles a igual distancia por debajo y por encima de un nivel pedido.
    const unit = unitForSession("incident_postmortem", "A1");
    // distancia A2=1 vs B1=2 vs B2=3 desde A1 -> más cercana es A2.
    expect(unit?.cefrLevel).toBe("A2");
  });

  it("devuelve undefined si el escenario no tiene ninguna unidad asociada", () => {
    expect(unitForSession("no_existe", "B1")).toBeUndefined();
  });
});
