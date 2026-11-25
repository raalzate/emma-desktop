/**
 * Unidades según el nivel (#357, T9): el aprendiz sólo ve las unidades de SU
 * nivel (y la 0 de pronunciación, que es de todos). Mismo criterio en
 * Ejercicios y Challenges: la fuente es `unitsForLevel` del catálogo.
 */
import { describe, expect, it } from "vitest";
import { practiceUnitsFor, pickPracticeUnit } from "../units-by-level";

const available = [0, 1, 2, 3, 4, 5, 6, 7, 8, 13, 19, 26];

describe("practiceUnitsFor", () => {
  it("A1: la de pronunciación y sus unidades, nada de otros niveles", () => {
    expect(practiceUnitsFor(available, "A1")).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("B1 sólo ve B1 (13–18) disponibles, más pronunciación", () => {
    expect(practiceUnitsFor(available, "B1")).toEqual([0, 13]);
  });

  it("C1 practica con las de B2 (el libro termina en B2), igual que el catálogo", () => {
    expect(practiceUnitsFor(available, "C1")).toEqual([0, 19, 26]);
  });

  it("sin la unidad 0 disponible (Challenges), sólo las del nivel", () => {
    expect(practiceUnitsFor([1, 2, 7, 13], "A2")).toEqual([7]);
  });
});

describe("pickPracticeUnit", () => {
  it("respeta una unidad pedida si es del nivel", () => {
    expect(pickPracticeUnit(available, "A1", 3)).toBe(3);
  });

  it("una unidad pedida de otro nivel no se abre: cae a la primera de contenido del nivel", () => {
    expect(pickPracticeUnit(available, "A1", 19)).toBe(1);
    expect(pickPracticeUnit(available, "A1", undefined)).toBe(1);
  });

  it("si el nivel no tiene contenido, la de pronunciación", () => {
    expect(pickPracticeUnit([0, 1], "B2", undefined)).toBe(0);
  });
});
