/**
 * Pruebas de integridad de la transcripción de las unidades 19–26 (B2)
 * del libro «English for Software Engineers».
 */

import { describe, expect, it } from "vitest";

import { UNITS_B2 } from "../units-b2";

describe("UNITS_B2 (unidades 19–26 del libro)", () => {
  it("contiene exactamente 8 unidades", () => {
    expect(UNITS_B2).toHaveLength(8);
  });

  it("cubre los números 19 a 26 en orden", () => {
    expect(UNITS_B2.map((u) => u.number)).toEqual([
      19, 20, 21, 22, 23, 24, 25, 26,
    ]);
  });

  it("todas las unidades son de nivel B2", () => {
    for (const unit of UNITS_B2) {
      expect(unit.cefrLevel).toBe("B2");
    }
  });

  it("cada unidad tiene al menos 10 chunks, todos con texto y función", () => {
    for (const unit of UNITS_B2) {
      expect(unit.chunks.length).toBeGreaterThanOrEqual(10);
      for (const chunk of unit.chunks) {
        expect(chunk.text.trim()).not.toBe("");
        expect(chunk.functionEs.trim()).not.toBe("");
      }
    }
  });

  it("cada unidad tiene al menos 5 trampas con wrong y right no vacíos", () => {
    for (const unit of UNITS_B2) {
      expect(unit.traps.length).toBeGreaterThanOrEqual(5);
      for (const trap of unit.traps) {
        expect(trap.wrong.trim()).not.toBe("");
        expect(trap.right.trim()).not.toBe("");
      }
    }
  });

  it("cada unidad tiene al menos 3 retos con instrucciones, criterios y modo", () => {
    for (const unit of UNITS_B2) {
      expect(unit.challenges.length).toBeGreaterThanOrEqual(3);
      for (const challenge of unit.challenges) {
        expect(challenge.instructionsEs.trim()).not.toBe("");
        expect(challenge.criteria.length).toBeGreaterThan(0);
        for (const criterion of challenge.criteria) {
          expect(criterion.trim()).not.toBe("");
        }
        expect(["written", "oral", "real-work", "memorization"]).toContain(
          challenge.mode,
        );
      }
    }
  });

  it("los retos siguen la numeración global 43–72 sin repetidos", () => {
    const ids = UNITS_B2.flatMap((u) => u.challenges.map((c) => c.id));
    const expected = Array.from({ length: 30 }, (_, i) => 43 + i);
    expect([...ids].sort((a, b) => a - b)).toEqual(expected);
  });

  it("el reto final 72 existe en la unidad 26", () => {
    const unit26 = UNITS_B2.find((u) => u.number === 26);
    expect(unit26).toBeDefined();
    const reto72 = unit26?.challenges.find((c) => c.id === 72);
    expect(reto72).toBeDefined();
    expect(reto72?.instructionsEs).toContain("reto final");
  });

  it("los campos descriptivos de cada unidad no están vacíos", () => {
    for (const unit of UNITS_B2) {
      expect(unit.title.trim()).not.toBe("");
      expect(unit.scenarioEs.trim()).not.toBe("");
      expect(unit.goalEs.trim()).not.toBe("");
      expect(unit.soundFocus.trim()).not.toBe("");
      expect(unit.grammarFocus.length).toBeGreaterThan(0);
      for (const focus of unit.grammarFocus) {
        expect(focus.trim()).not.toBe("");
      }
    }
  });

  it("cada unidad declara los scenarioTypes fijos esperados", () => {
    const expected: Record<number, string[]> = {
      19: ["incident_postmortem", "retrospective"],
      20: ["design_review", "architecture_pitch", "hiring_debrief"],
      21: ["architecture_pitch", "stakeholder_pres", "tech_strategy_pitch"],
      22: ["tech_interview", "behavioral_qa", "pair_programming"],
      23: ["salary_negotiation", "talent_negotiation", "vendor_call"],
      24: ["peer_feedback_1on1", "mentor_junior"],
      25: ["stakeholder_pres", "tool_demo", "sprint_review", "escalation_call"],
      26: ["slack_thread", "documentation_workshop", "code_review"],
    };
    for (const unit of UNITS_B2) {
      expect(unit.scenarioTypes).toEqual(expected[unit.number]);
    }
  });
});
