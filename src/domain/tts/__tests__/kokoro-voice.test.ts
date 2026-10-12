import { describe, it, expect } from "vitest";
import { kokoroVoiceFor } from "../kokoro-voice";
import { PROTOPERSONAS } from "@/domain/personas/protopersona";

describe("kokoroVoiceFor", () => {
  it("Emma (voz Edge reservada) usa af_heart", () => {
    expect(kokoroVoiceFor("en-US-EmmaNeural", "feminine")).toBe("af_heart");
  });

  it("sin voz ni género es la voz de Emma", () => {
    expect(kokoroVoiceFor()).toBe("af_heart");
    expect(kokoroVoiceFor(undefined, "feminine")).toBe("af_heart");
  });

  it("sin voz y masculino devuelve una voz masculina estadounidense", () => {
    expect(kokoroVoiceFor(undefined, "masculine")).toMatch(/^am_/);
  });

  it("respeta el género: femenino af_/bf_, masculino am_/bm_", () => {
    expect(kokoroVoiceFor("en-US-JennyNeural", "feminine")).toMatch(/^af_/);
    expect(kokoroVoiceFor("en-US-GuyNeural", "masculine")).toMatch(/^am_/);
  });

  it("respeta el acento: en-GB usa bf_/bm_ y el resto af_/am_", () => {
    expect(kokoroVoiceFor("en-GB-LibbyNeural", "feminine")).toMatch(/^bf_/);
    expect(kokoroVoiceFor("en-GB-ThomasNeural", "masculine")).toMatch(/^bm_/);
    expect(kokoroVoiceFor("en-IN-NeerjaNeural", "feminine")).toMatch(/^af_/);
    expect(kokoroVoiceFor("en-AU-NatashaNeural", "feminine")).toMatch(/^af_/);
  });

  it("es estable: la misma entrada da siempre la misma voz", () => {
    expect(kokoroVoiceFor("en-US-AriaNeural", "feminine")).toBe(kokoroVoiceFor("en-US-AriaNeural", "feminine"));
  });

  it("af_heart es exclusiva de Emma: ninguna protopersona la recibe", () => {
    for (const p of Object.values(PROTOPERSONAS)) {
      expect(kokoroVoiceFor(p.ttsVoice, p.voice)).not.toBe("af_heart");
    }
  });

  it("personas distintas tienden a voces distintas", () => {
    const voices = Object.values(PROTOPERSONAS).map((p) => kokoroVoiceFor(p.ttsVoice, p.voice));
    expect(new Set(voices).size).toBeGreaterThanOrEqual(Math.ceil(voices.length / 2));
  });

  it("sin id Edge reconocible cae al acento estadounidense", () => {
    expect(kokoroVoiceFor("raro", "masculine")).toMatch(/^am_/);
  });
});
