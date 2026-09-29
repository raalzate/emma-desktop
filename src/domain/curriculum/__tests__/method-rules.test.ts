import { describe, it, expect } from "vitest";
import { METHOD_RULES, METHOD_MISTAKES } from "../method-rules";

describe("METHOD_RULES", () => {
  it("transcribe las diez reglas del método (0.7) en orden", () => {
    expect(METHOD_RULES).toHaveLength(10);
    expect(METHOD_RULES.map((r) => r.id)).toEqual(Array.from({ length: 10 }, (_, i) => i + 1));
    expect(METHOD_RULES[0].rule).toMatch(/40 minutes a day beat 4 hours on Saturday/);
    expect(METHOD_RULES[9].rule).toMatch(/Use English at work today/);
  });

  it("cada regla tiene un detalle explicativo no vacío", () => {
    for (const rule of METHOD_RULES) {
      expect(rule.detail.length).toBeGreaterThan(0);
    }
  });
});

describe("METHOD_MISTAKES", () => {
  it("transcribe los cinco errores de método a evitar (0.8)", () => {
    expect(METHOD_MISTAKES).toHaveLength(5);
    expect(METHOD_MISTAKES.map((m) => m.id)).toEqual(Array.from({ length: 5 }, (_, i) => i + 1));
    expect(METHOD_MISTAKES[0].rule).toMatch(/Watching shows without structure/);
  });

  it("cada error trae el detalle de por qué falla y qué hacer en su lugar", () => {
    for (const mistake of METHOD_MISTAKES) {
      expect(mistake.detail.length).toBeGreaterThan(0);
    }
  });
});
