import { describe, it, expect } from "vitest";
import {
  STUDY_PLAN_24_WEEKS,
  DAILY_DISTRIBUTION,
  weekForUnit,
  weeksForCefrTarget,
  unitsForWeek,
} from "../study-plan";

describe("STUDY_PLAN_24_WEEKS", () => {
  it("tiene 24 semanas numeradas de 1 a 24", () => {
    expect(STUDY_PLAN_24_WEEKS).toHaveLength(24);
    expect(STUDY_PLAN_24_WEEKS.map((w) => w.week)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    );
  });

  it("las semanas de fonética (1-3) no cubren unidades", () => {
    expect(STUDY_PLAN_24_WEEKS[0].units).toEqual([]);
    expect(STUDY_PLAN_24_WEEKS[1].units).toEqual([]);
    expect(STUDY_PLAN_24_WEEKS[2].units).toEqual([]);
  });

  it("la semana 4 cubre las unidades 1 y 2 con su hito del Apéndice J", () => {
    const week4 = STUDY_PLAN_24_WEEKS.find((w) => w.week === 4);
    expect(week4?.units).toEqual([1, 2]);
    expect(week4?.milestone).toMatch(/Presentarte en 60 s/);
  });

  it("la semana 24 cubre las unidades 25 y 26 con el hito Reto 72", () => {
    const week24 = STUDY_PLAN_24_WEEKS.find((w) => w.week === 24);
    expect(week24?.units).toEqual([25, 26]);
    expect(week24?.milestone).toMatch(/Reto 72/);
  });

  it("cubre en total las 26 unidades, cada una exactamente una vez", () => {
    const allUnits = STUDY_PLAN_24_WEEKS.flatMap((w) => w.units).sort((a, b) => a - b);
    expect(allUnits).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
  });
});

describe("DAILY_DISTRIBUTION", () => {
  it("suma 45 minutos con los cinco bloques del Apéndice J", () => {
    const total = Object.values(DAILY_DISTRIBUTION).reduce((a, b) => a + b, 0);
    expect(total).toBe(45); // 5 repaso + 10 input + 10 notice + 10 practice + 10 output
  });
});

describe("weekForUnit", () => {
  it("devuelve la semana donde se cubre una unidad dada", () => {
    expect(weekForUnit(1)).toBe(4);
    expect(weekForUnit(10)).toBe(12);
    expect(weekForUnit(26)).toBe(24);
  });

  it("devuelve null para una unidad fuera de rango", () => {
    expect(weekForUnit(0)).toBeNull();
    expect(weekForUnit(27)).toBeNull();
  });
});

describe("unitsForWeek", () => {
  it("devuelve las unidades cubiertas por una semana dada", () => {
    expect(unitsForWeek(4)).toEqual([1, 2]);
    expect(unitsForWeek(24)).toEqual([25, 26]);
  });

  it("devuelve un array vacío en semanas de fonética o fuera de rango", () => {
    expect(unitsForWeek(1)).toEqual([]);
    expect(unitsForWeek(99)).toEqual([]);
  });
});

describe("weeksForCefrTarget", () => {
  it("mapea cada nivel MCER al rango de semanas de la tabla 0.4", () => {
    expect(weeksForCefrTarget("A1")).toEqual({ start: 3, end: 7 });
    expect(weeksForCefrTarget("A2")).toEqual({ start: 8, end: 12 });
    expect(weeksForCefrTarget("B1")).toEqual({ start: 13, end: 17 });
    expect(weeksForCefrTarget("B2")).toEqual({ start: 18, end: 23 });
  });
});
