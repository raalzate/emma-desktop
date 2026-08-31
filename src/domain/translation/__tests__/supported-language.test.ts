import { describe, it, expect } from "vitest";
import { SUPPORTED_LANGUAGES, isSupported } from "../supported-language";

describe("supported-language", () => {
  it("expone los idiomas destino con code y label esperados", () => {
    expect(SUPPORTED_LANGUAGES.es).toEqual({ code: "es", label: "Spanish" });
    expect(SUPPORTED_LANGUAGES.zh).toEqual({ code: "zh", label: "Mandarin" });
  });

  it("mantiene consistencia entre la clave y el code de cada entrada", () => {
    for (const [key, lang] of Object.entries(SUPPORTED_LANGUAGES)) {
      expect(lang.code).toBe(key);
    }
  });

  it("reconoce un idioma soportado", () => {
    expect(isSupported("es")).toBe(true);
    expect(isSupported("fr")).toBe(true);
  });

  it("rechaza un idioma no soportado", () => {
    expect(isSupported("en")).toBe(false);
    expect(isSupported("")).toBe(false);
  });

  it("no confunde propiedades heredadas de Object con idiomas", () => {
    // hasOwnProperty.call protege contra "toString", "constructor", etc.
    expect(isSupported("toString")).toBe(false);
    expect(isSupported("constructor")).toBe(false);
    expect(isSupported("hasOwnProperty")).toBe(false);
  });
});
