/**
 * Unidades de ejercicios según el nivel (#357, T9): el selector listaba las 27
 * unidades sin importar el nivel; un A1 veía «Third conditional».
 */
import { describe, expect, it } from "vitest";
import { groupUnitsForLevel } from "../units-by-level";

const units = [
  { number: 1, cefrLevel: "A1" as const },
  { number: 2, cefrLevel: "A1" as const },
  { number: 7, cefrLevel: "A2" as const },
  { number: 13, cefrLevel: "B1" as const },
  { number: 19, cefrLevel: "B2" as const },
];
const available = [0, 1, 2, 7, 13, 19];

describe("groupUnitsForLevel", () => {
  it("primero el nivel del aprendiz con la pronunciación, después los demás niveles en orden", () => {
    expect(groupUnitsForLevel(available, units, "A1")).toEqual([
      { level: "A1", current: true, units: [0, 1, 2] },
      { level: "A2", current: false, units: [7] },
      { level: "B1", current: false, units: [13] },
      { level: "B2", current: false, units: [19] },
    ]);
  });

  it("un B1 ve primero B1 (con pronunciación) y después los demás", () => {
    const groups = groupUnitsForLevel(available, units, "B1");
    expect(groups[0]).toEqual({ level: "B1", current: true, units: [0, 13] });
    expect(groups.map((g) => g.level)).toEqual(["B1", "A1", "A2", "B2"]);
  });

  it("la unidad por defecto es la primera de contenido del nivel, no la de pronunciación", async () => {
    const { defaultUnitFor } = await import("../units-by-level");
    expect(defaultUnitFor(available, units, "A2")).toBe(7);
    expect(defaultUnitFor([0], units, "C1")).toBe(0);
  });
});
