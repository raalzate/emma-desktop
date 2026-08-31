import { describe, it, expect } from "vitest";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  pairLines,
} from "../translation-prompt";

describe("buildUserPrompt", () => {
  it("inyecta el nombre del idioma y el texto verbatim", () => {
    expect(buildUserPrompt("Spanish", "Hello world")).toBe(
      "Translate to Spanish:\nHello world",
    );
  });

  it("preserva saltos de línea del texto original", () => {
    expect(buildUserPrompt("French", "Line 1\nLine 2")).toBe(
      "Translate to French:\nLine 1\nLine 2",
    );
  });
});

describe("SYSTEM_PROMPT", () => {
  it("instruye traducir frase por frase sin texto extra", () => {
    expect(SYSTEM_PROMPT).toContain("sentence by sentence");
    expect(SYSTEM_PROMPT).toContain("Output ONLY the pairs");
  });
});

describe("pairLines", () => {
  it("empareja líneas alternas en pares (original, traducción)", () => {
    const raw = "Hello\nHola\n\nGoodbye\nAdiós";
    expect(pairLines(raw)).toEqual([
      { source: "Hello", target: "Hola" },
      { source: "Goodbye", target: "Adiós" },
    ]);
  });

  it("devuelve lista vacía para entrada vacía", () => {
    expect(pairLines("")).toEqual([]);
  });

  it("devuelve lista vacía para entrada de solo espacios y saltos", () => {
    expect(pairLines("   \n\n  \n")).toEqual([]);
  });

  it("recorta espacios en cada línea", () => {
    expect(pairLines("  Hello  \n  Hola  ")).toEqual([
      { source: "Hello", target: "Hola" },
    ]);
  });

  it("colapsa líneas en blanco de más entre frase y traducción", () => {
    // El LLM pequeño mete saltos extra; el re-emparejado debe tolerarlo.
    const raw = "Hello\n\n\nHola\n\n\nGoodbye\n\nAdiós";
    expect(pairLines(raw)).toEqual([
      { source: "Hello", target: "Hola" },
      { source: "Goodbye", target: "Adiós" },
    ]);
  });

  it("empareja una línea suelta final con cadena vacía", () => {
    expect(pairLines("Hello\nHola\nGoodbye")).toEqual([
      { source: "Hello", target: "Hola" },
      { source: "Goodbye", target: "" },
    ]);
  });

  it("tolera terminadores de línea CRLF", () => {
    expect(pairLines("Hello\r\nHola")).toEqual([
      { source: "Hello", target: "Hola" },
    ]);
  });
});
