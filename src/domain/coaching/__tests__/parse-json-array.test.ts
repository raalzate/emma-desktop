import { describe, it, expect } from "vitest";
import { extractJsonArray, parseRawArray, isNonEmptyString } from "../parse-json-array";

describe("extractJsonArray", () => {
  it("devuelve el array crudo cuando el texto es solo un array", () => {
    expect(extractJsonArray('["a","b"]')).toBe('["a","b"]');
  });

  it("aísla el array cuando el modelo lo envuelve en comentario", () => {
    expect(extractJsonArray('Claro, aquí van: ["a","b"] listo')).toBe('["a","b"]');
  });

  it("recorta el texto cuando no hay ningún array", () => {
    expect(extractJsonArray("  sin json aquí  ")).toBe("sin json aquí");
  });

  it("es greedy: abarca del primer '[' al último ']' cuando hay dos arrays", () => {
    // El regex /\[[\s\S]*\]/ toma todo el tramo entre corchetes, no solo el 1º.
    expect(extractJsonArray("[1] y [2]")).toBe("[1] y [2]");
  });
});

describe("parseRawArray", () => {
  it("parsea un array JSON limpio", () => {
    expect(parseRawArray('["hola","adios"]')).toEqual(["hola", "adios"]);
  });

  it("parsea un array embebido en texto extra", () => {
    expect(parseRawArray('respuesta: ["x"] fin')).toEqual(["x"]);
  });

  it("devuelve [] ante JSON inválido sin lanzar", () => {
    expect(parseRawArray("[roto")).toEqual([]);
  });

  it("devuelve [] cuando el JSON es válido pero no es un array", () => {
    expect(parseRawArray('{"a":1}')).toEqual([]);
  });

  it("devuelve [] con string vacía", () => {
    expect(parseRawArray("")).toEqual([]);
  });

  it("devuelve [] cuando hay dos arrays (el tramo greedy no es JSON válido)", () => {
    expect(parseRawArray("[1] y [2]")).toEqual([]);
  });
});

describe("isNonEmptyString", () => {
  it("es true para una string con contenido", () => {
    expect(isNonEmptyString("hola")).toBe(true);
  });

  it("es false para string vacía o solo espacios", () => {
    expect(isNonEmptyString("")).toBe(false);
    expect(isNonEmptyString("   ")).toBe(false);
  });

  it("es false para tipos que no son string", () => {
    expect(isNonEmptyString(42)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(["a"])).toBe(false);
  });
});
