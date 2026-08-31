import { describe, expect, it } from "vitest";

import { ALL_UNITS } from "@/lib/curriculum-data";

describe("ALL_UNITS (agregador A1+A2+B1+B2)", () => {
  it("contiene las 26 unidades del libro numeradas 1-26 en orden", () => {
    expect(ALL_UNITS).toHaveLength(26);
    expect(ALL_UNITS.map((u) => u.number)).toEqual(
      Array.from({ length: 26 }, (_, i) => i + 1),
    );
  });

  it("respeta el orden A1 -> A2 -> B1 -> B2 por nivel CEFR", () => {
    const levels = ALL_UNITS.map((u) => u.cefrLevel);
    const firstB1Index = levels.indexOf("B1");
    const lastA2Index = levels.lastIndexOf("A2");
    expect(lastA2Index).toBeLessThan(firstB1Index);
  });
});
