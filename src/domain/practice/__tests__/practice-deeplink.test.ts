/**
 * Deep-link de Práctica (?tab=&unit=): la pestaña que abre y su alias, para
 * que «Empezar» en Mis lecciones y las recomendaciones de Emma aterricen bien.
 */

import { describe, expect, it } from "vitest";
import { practiceTargetFromSearch } from "../practice-deeplink";

describe("practiceTargetFromSearch", () => {
  it("sin parámetros abre Ejercicios sin unidad", () => {
    expect(practiceTargetFromSearch(new URLSearchParams(""))).toEqual({ tab: "exercises", unit: undefined });
  });
  it("resuelve el alias assessment y la unidad numérica", () => {
    expect(practiceTargetFromSearch(new URLSearchParams("tab=assessment"))).toEqual({
      tab: "self-assessment",
      unit: undefined,
    });
    expect(practiceTargetFromSearch(new URLSearchParams("tab=challenges&unit=4"))).toEqual({
      tab: "challenges",
      unit: 4,
    });
  });
  it("una pestaña desconocida o unidad no numérica caen al valor por defecto", () => {
    expect(practiceTargetFromSearch(new URLSearchParams("tab=nada&unit=x"))).toEqual({
      tab: "exercises",
      unit: undefined,
    });
  });
});
