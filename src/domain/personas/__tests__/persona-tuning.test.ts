import { describe, it, expect } from "vitest";
import {
  DEFAULT_PERSONA_TUNING,
  normalizePersonaTuning,
  renderCharacterStyle,
} from "../persona-tuning";

describe("persona-tuning", () => {
  it("renderCharacterStyle produce un bloque CHARACTER STYLE con directivas", () => {
    const block = renderCharacterStyle({
      tone: "casual",
      attitude: "enthusiastic",
      voiceStyle: "assertive",
    });
    expect(block).toMatch(/CHARACTER STYLE/);
    expect(block).toMatch(/casual/);
    expect(block).toMatch(/upbeat|energetic/i);
    expect(block).toMatch(/direct and confident/i);
    // La regla de inglés (inmersión) vive en EMMA_BASE ("ENGLISH ONLY"),
    // no en este bloque: el prompt compacto evita directivas duplicadas.
  });

  it("normalizePersonaTuning sanea valores inválidos al default", () => {
    const t = normalizePersonaTuning({ tone: "xxx", attitude: "sarcastic", voiceStyle: 3 });
    expect(t.tone).toBe(DEFAULT_PERSONA_TUNING.tone);
    expect(t.attitude).toBe("sarcastic");
    expect(t.voiceStyle).toBe(DEFAULT_PERSONA_TUNING.voiceStyle);
  });

  it("normalizePersonaTuning con undefined devuelve el default completo", () => {
    expect(normalizePersonaTuning(undefined)).toEqual(DEFAULT_PERSONA_TUNING);
  });
});
