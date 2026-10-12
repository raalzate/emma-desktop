import { describe, expect, it } from "vitest";
import { pickNaturalVoice, type VoiceInfo } from "../voice-ranking";

const v = (name: string, lang = "en-US"): VoiceInfo => ({ name, lang });

describe("pickNaturalVoice", () => {
  it("prefiere una voz Premium/Enhanced sobre la compacta del mismo idioma", () => {
    const voces = [v("Samantha"), v("Albert"), v("Ava (Premium)"), v("Zoe (Enhanced)")];
    expect(pickNaturalVoice(voces, "en-US", "feminine")?.name).toBe("Ava (Premium)");
  });

  it("toma las voces neuronales en línea (Natural/Online/Google) antes que las del SO", () => {
    const voces = [v("Samantha"), v("Microsoft Aria Online (Natural) - English (United States)")];
    expect(pickNaturalVoice(voces, "en-US", "feminine")?.name).toContain("Aria Online");
  });

  it("nunca elige voces de novedad aunque sean las únicas en inglés con calidad", () => {
    const voces = [v("Bad News"), v("Zarvox"), v("Whisper"), v("Fred")];
    expect(pickNaturalVoice(voces, "en-US", "feminine")?.name).toBe("Fred");
  });

  it("respeta el género pedido entre voces de igual calidad", () => {
    const voces = [v("Samantha"), v("Daniel", "en-GB"), v("Alex")];
    expect(pickNaturalVoice(voces, "en-US", "masculine")?.name).toBe("Alex");
  });

  it("prefiere la variante regional exacta (en-US) sobre otra del mismo idioma", () => {
    const voces = [v("Karen", "en-AU"), v("Samantha", "en-US")];
    expect(pickNaturalVoice(voces, "en-US", "feminine")?.name).toBe("Samantha");
  });

  it("sin voces del idioma ⇒ undefined (el motor usa su voz por defecto)", () => {
    expect(pickNaturalVoice([v("Mónica", "es-ES")], "en-US")).toBeUndefined();
  });
});
