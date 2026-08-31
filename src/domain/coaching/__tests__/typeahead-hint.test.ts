/**
 * El autocompletar debe ayudar sin producir la frase por el aprendiz.
 *
 * Mismo criterio por el que las sugerencias dejaron de ser clicables: a partir
 * de B1 escribir la frase entera anula el output forzado que consolida la
 * estructura. En A1–A2 el andamiaje completo sí ayuda a arrancar.
 */

import { describe, expect, it } from "vitest";
import { hintForLevel, HINT_WORDS_ADVANCED } from "@/domain/coaching/typeahead-hint";

describe("hintForLevel", () => {
  it("da el sufijo completo en A1 y A2 (andamiaje para arrancar)", () => {
    const suffix = " to the shared drive to finish the report.";
    expect(hintForLevel(suffix, "A1")).toBe(suffix);
    expect(hintForLevel(suffix, "A2")).toBe(suffix);
  });

  it("en B1 y superiores recorta a una pista de pocas palabras", () => {
    const hint = hintForLevel(" to the shared drive to finish the report.", "B1");
    expect(hint.trim().split(/\s+/)).toHaveLength(HINT_WORDS_ADVANCED);
    expect(hint).toBe(" to the");
  });

  it("recorta igual en B2 y C1", () => {
    for (const level of ["B2", "C1"] as const) {
      expect(hintForLevel(" to the shared drive", level)).toBe(" to the");
    }
  });

  it("conserva el espacio inicial que separa del texto escrito", () => {
    expect(hintForLevel(" to the drive", "B1").startsWith(" ")).toBe(true);
  });

  it("no inventa nada si el sufijo es más corto que la pista", () => {
    expect(hintForLevel(" done", "B2")).toBe(" done");
    expect(hintForLevel("", "B2")).toBe("");
    expect(hintForLevel("   ", "B2")).toBe("");
  });
});
