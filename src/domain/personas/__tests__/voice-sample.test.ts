import { describe, it, expect } from "vitest";
import { PROTOPERSONAS } from "@/domain/personas/protopersona";
import { hasSpeakableContent } from "@/domain/tts/speakable-text";
import { kokoroVoiceFor } from "@/domain/tts/kokoro-voice";
import { describePersonaVoice, voiceSampleText } from "@/domain/personas/voice-sample";

const personas = Object.values(PROTOPERSONAS);

describe("voiceSampleText", () => {
  it("se presenta con nombre y rol en inglés", () => {
    const text = voiceSampleText(PROTOPERSONAS.daily_standup);
    expect(text).toBe("Hi, I'm Sofía Torres, your Scrum Master. Ready when you are.");
  });

  it("es hablable y no lleva emojis para todas las personas", () => {
    for (const p of personas) {
      const text = voiceSampleText(p);
      expect(hasSpeakableContent(text)).toBe(true);
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});

describe("describePersonaVoice", () => {
  it("usa la voz Kokoro que resuelve kokoroVoiceFor", () => {
    for (const p of personas) {
      expect(describePersonaVoice(p).kokoroVoice).toBe(kokoroVoiceFor(p.ttsVoice, p.voice));
    }
  });

  it("deduce el acento del prefijo a/b de la voz Kokoro", () => {
    const us = describePersonaVoice({ ...PROTOPERSONAS.daily_standup, ttsVoice: "en-US-JennyNeural" });
    const gb = describePersonaVoice({ ...PROTOPERSONAS.daily_standup, ttsVoice: "en-GB-SoniaNeural" });
    expect(us.accent).toBe("US English");
    expect(gb.accent).toBe("British English");
    expect(gb.kokoroVoice.startsWith("b")).toBe(true);
  });

  it("devuelve el género de la persona", () => {
    expect(describePersonaVoice(PROTOPERSONAS.code_review).gender).toBe("masculine");
    expect(describePersonaVoice(PROTOPERSONAS.daily_standup).gender).toBe("feminine");
  });
});
