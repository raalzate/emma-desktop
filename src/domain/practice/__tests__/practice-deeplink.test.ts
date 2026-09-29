/**
 * Deep-link de Práctica (?tab=&unit=): la pestaña que abre y su alias, para
 * que «Empezar» en Mis lecciones y las recomendaciones de Emma aterricen bien.
 */

import { describe, expect, it } from "vitest";
import {
  legacyPracticeRedirect,
  parsePracticeUnit,
  practiceHrefFor,
  practiceTargetFromSearch,
} from "../practice-deeplink";

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

// H6 (#199): cada pestaña ahora es una ruta propia bajo /practice.
describe("practiceHrefFor", () => {
  it("mapea cada pestaña a su ruta con slash final, sin query si no hay parámetros", () => {
    expect(practiceHrefFor("exercises")).toBe("/practice/exercises/");
    expect(practiceHrefFor("srs")).toBe("/practice/review/");
    expect(practiceHrefFor("pronunciation")).toBe("/practice/pronunciation/");
    expect(practiceHrefFor("plan")).toBe("/practice/plan/");
    expect(practiceHrefFor("self-assessment")).toBe("/practice/self-check/");
    expect(practiceHrefFor("challenges")).toBe("/practice/challenges/");
  });

  it("conserva los parámetros de la consulta y descarta los vacíos o indefinidos", () => {
    expect(practiceHrefFor("exercises", { unit: 13, exercise: "u13-fill" })).toBe(
      "/practice/exercises/?unit=13&exercise=u13-fill",
    );
    expect(practiceHrefFor("pronunciation", { contrast: "i-vs-ii", vacio: undefined })).toBe(
      "/practice/pronunciation/?contrast=i-vs-ii",
    );
  });
});

// Las subrutas (Exercises, Challenges) leen `?unit=` directo, sin pasar por `tab`.
describe("parsePracticeUnit", () => {
  it("entero válido se devuelve como número; nulo o no numérico caen a undefined", () => {
    expect(parsePracticeUnit("13")).toBe(13);
    expect(parsePracticeUnit(null)).toBeUndefined();
    expect(parsePracticeUnit("x")).toBeUndefined();
  });
});

describe("legacyPracticeRedirect", () => {
  it("sin ?tab= no redirige", () => {
    expect(legacyPracticeRedirect(new URLSearchParams("unit=3"))).toBeNull();
  });

  it("?tab=X redirige a la ruta nueva conservando los demás parámetros", () => {
    expect(legacyPracticeRedirect(new URLSearchParams("tab=exercises&unit=13&exercise=u13-fill"))).toBe(
      "/practice/exercises/?exercise=u13-fill&unit=13",
    );
    expect(legacyPracticeRedirect(new URLSearchParams("tab=assessment&level=B1"))).toBe(
      "/practice/self-check/?level=B1",
    );
    expect(legacyPracticeRedirect(new URLSearchParams("tab=srs"))).toBe("/practice/review/");
  });
});
