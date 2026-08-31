/**
 * Pruebas de integridad de la transcripción de las Unidades 7–12 (A2)
 * del libro «English for Software Engineers».
 */

import { describe, expect, it } from "vitest";

import { UNITS_A2 } from "../units-a2";

const MODOS_VALIDOS = ["written", "oral", "real-work", "memorization"] as const;

// Retos globales del libro por unidad (numeración 1–72).
const RETOS_ESPERADOS: Record<number, number[]> = {
  7: [14, 15],
  8: [16, 17],
  9: [18, 19],
  10: [20, 21, 22],
  11: [23, 24],
  12: [25, 26],
};

const SCENARIO_TYPES_ESPERADOS: Record<number, string[]> = {
  7: ["daily_standup"],
  8: ["tech_comparison", "design_review"],
  9: ["task_estimation"],
  10: ["behavioral_qa", "tech_interview"],
  11: ["documentation_workshop", "oncall_handover"],
  12: ["bug_triage", "incident_postmortem"],
};

describe("UNITS_A2 — Unidades 7–12 del libro (nivel A2)", () => {
  it("contiene exactamente 6 unidades numeradas 7–12 en orden", () => {
    expect(UNITS_A2).toHaveLength(6);
    expect(UNITS_A2.map((u) => u.number)).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it("todas las unidades declaran nivel A2", () => {
    for (const unit of UNITS_A2) {
      expect(unit.cefrLevel).toBe("A2");
    }
  });

  it("cada unidad tiene título, escenario, meta y foco fonético no vacíos", () => {
    for (const unit of UNITS_A2) {
      expect(unit.title.trim()).not.toBe("");
      expect(unit.scenarioEs.trim()).not.toBe("");
      expect(unit.goalEs.trim()).not.toBe("");
      expect(unit.soundFocus.trim()).not.toBe("");
    }
  });

  it("cada unidad tiene focos gramaticales no vacíos", () => {
    for (const unit of UNITS_A2) {
      expect(unit.grammarFocus.length).toBeGreaterThan(0);
      for (const focus of unit.grammarFocus) {
        expect(focus.trim()).not.toBe("");
      }
    }
  });

  it("cada unidad tiene al menos 8 chunks con texto y función no vacíos", () => {
    for (const unit of UNITS_A2) {
      expect(unit.chunks.length).toBeGreaterThanOrEqual(8);
      for (const chunk of unit.chunks) {
        expect(chunk.text.trim()).not.toBe("");
        expect(chunk.functionEs.trim()).not.toBe("");
      }
    }
  });

  // La Unidad 7 es la excepción documentada: el libro no incluye tabla
  // «Trampas del hispanohablante» en esa unidad, por eso se exige ≥0.
  it("cada unidad tiene al menos 5 trampas (la 7 puede tener 0: el libro no trae tabla)", () => {
    for (const unit of UNITS_A2) {
      const minimo = unit.number === 7 ? 0 : 5;
      expect(unit.traps.length).toBeGreaterThanOrEqual(minimo);
      for (const trap of unit.traps) {
        expect(trap.wrong.trim()).not.toBe("");
        expect(trap.right.trim()).not.toBe("");
      }
    }
  });

  it("cada unidad tiene al menos 2 retos con instrucciones, criterios y modo válidos", () => {
    for (const unit of UNITS_A2) {
      expect(unit.challenges.length).toBeGreaterThanOrEqual(2);
      for (const challenge of unit.challenges) {
        expect(challenge.instructionsEs.trim()).not.toBe("");
        expect(challenge.criteria.length).toBeGreaterThan(0);
        for (const criterion of challenge.criteria) {
          expect(criterion.trim()).not.toBe("");
        }
        expect(MODOS_VALIDOS).toContain(challenge.mode);
      }
    }
  });

  it("los retos usan la numeración global del libro (14–26)", () => {
    for (const unit of UNITS_A2) {
      expect(unit.challenges.map((c) => c.id)).toEqual(
        RETOS_ESPERADOS[unit.number],
      );
    }
  });

  it("los scenarioTypes de EMMA coinciden con el mapeo fijado por unidad", () => {
    for (const unit of UNITS_A2) {
      expect(unit.scenarioTypes).toEqual(SCENARIO_TYPES_ESPERADOS[unit.number]);
    }
  });
});
