import { describe, expect, it } from "vitest";

import { UNITS_A1 } from "@/lib/curriculum-data/units-a1";

describe("UNITS_A1 (unidades 1-6 del libro, nivel A1)", () => {
  it("contiene exactamente 6 unidades numeradas 1-6 en orden", () => {
    expect(UNITS_A1).toHaveLength(6);
    expect(UNITS_A1.map((u) => u.number)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("todas las unidades son de nivel A1", () => {
    for (const unit of UNITS_A1) {
      expect(unit.cefrLevel).toBe("A1");
    }
  });

  it("cada unidad tiene al menos 8 chunks con texto y función no vacíos", () => {
    for (const unit of UNITS_A1) {
      expect(unit.chunks.length, `unidad ${unit.number}`).toBeGreaterThanOrEqual(8);
      for (const chunk of unit.chunks) {
        expect(chunk.text.trim()).not.toBe("");
        expect(chunk.functionEs.trim()).not.toBe("");
      }
    }
  });

  it("cada unidad tiene al menos 5 trampas con wrong/right no vacíos", () => {
    for (const unit of UNITS_A1) {
      expect(unit.traps.length, `unidad ${unit.number}`).toBeGreaterThanOrEqual(5);
      for (const trap of unit.traps) {
        expect(trap.wrong.trim()).not.toBe("");
        expect(trap.right.trim()).not.toBe("");
      }
    }
  });

  it("cada unidad tiene al menos 2 retos con instrucciones y criterios", () => {
    for (const unit of UNITS_A1) {
      expect(unit.challenges.length, `unidad ${unit.number}`).toBeGreaterThanOrEqual(2);
      for (const challenge of unit.challenges) {
        expect(challenge.instructionsEs.trim()).not.toBe("");
        expect(challenge.criteria.length).toBeGreaterThan(0);
        for (const criterion of challenge.criteria) {
          expect(criterion.trim()).not.toBe("");
        }
      }
    }
  });

  it("los ids de los retos siguen la numeración global 1-13 del libro sin repetirse", () => {
    const ids = UNITS_A1.flatMap((u) => u.challenges.map((c) => c.id));
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });

  it("los campos descriptivos de cada unidad no están vacíos", () => {
    for (const unit of UNITS_A1) {
      expect(unit.title.trim()).not.toBe("");
      expect(unit.scenarioEs.trim()).not.toBe("");
      expect(unit.goalEs.trim()).not.toBe("");
      expect(unit.soundFocus.trim()).not.toBe("");
      expect(unit.grammarFocus.length).toBeGreaterThan(0);
      for (const focus of unit.grammarFocus) {
        expect(focus.trim()).not.toBe("");
      }
      expect(unit.scenarioTypes.length).toBeGreaterThan(0);
    }
  });
});
