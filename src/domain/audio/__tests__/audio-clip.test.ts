import { describe, expect, it } from "vitest";
import {
  attemptClipId,
  CLIP_ID_PATTERN,
  emmaClipId,
  isStorableClip,
  learnerClipId,
  MAX_CLIP_BYTES,
  stableHash,
} from "../audio-clip";

describe("stableHash", () => {
  it("es determinista y devuelve 16 hex", () => {
    expect(stableHash("hola")).toBe(stableHash("hola"));
    expect(stableHash("hola")).toMatch(/^[0-9a-f]{16}$/);
  });

  it("textos distintos dan hashes distintos", () => {
    expect(stableHash("a")).not.toBe(stableHash("b"));
    expect(stableHash("")).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("emmaClipId", () => {
  it("misma frase y misma voz dan el mismo id válido", () => {
    const id = emmaClipId("Good morning, Ana.", "af_heart");
    expect(id).toBe(emmaClipId("Good morning, Ana.", "af_heart"));
    expect(id).toMatch(CLIP_ID_PATTERN);
    expect(id.startsWith("emma-")).toBe(true);
  });

  it("otra voz da otro id", () => {
    expect(emmaClipId("Hi", "af_heart")).not.toBe(emmaClipId("Hi", "af_bella"));
  });

  it("ignora mayúsculas y espacios sobrantes de la frase (dedupe)", () => {
    expect(emmaClipId("  Hello   there ", "v")).toBe(emmaClipId("hello there", "v"));
  });
});

describe("learnerClipId", () => {
  it("es idempotente por conversación y turno, y cumple el patrón", () => {
    const id = learnerClipId("conv_ABC 1", 3);
    expect(id).toBe(learnerClipId("conv_ABC 1", 3));
    expect(id).toMatch(CLIP_ID_PATTERN);
    expect(id.startsWith("learner-")).toBe(true);
    expect(id).not.toBe(learnerClipId("conv_ABC 1", 4));
  });

  it("un id de conversación larguísimo o raro sigue siendo válido", () => {
    expect(learnerClipId("Ñ".repeat(300), 1)).toMatch(CLIP_ID_PATTERN);
    expect(learnerClipId("***", 1)).toMatch(CLIP_ID_PATTERN);
  });

  it("conversaciones distintas con el mismo slug no colisionan", () => {
    expect(learnerClipId("a b", 1)).not.toBe(learnerClipId("a_b", 1));
  });
});

describe("attemptClipId", () => {
  it("combina tarjeta y marca de tiempo en un id válido", () => {
    const id = attemptClipId("audio-emma-1", 1700000000000);
    expect(id).toMatch(CLIP_ID_PATTERN);
    expect(id.startsWith("attempt-")).toBe(true);
    expect(id).not.toBe(attemptClipId("audio-emma-1", 1700000000001));
  });
});

describe("isStorableClip", () => {
  const ok = { text: "hello", durationMs: 2000, bytes: 10_000 };

  it("acepta un clip normal", () => {
    expect(isStorableClip(ok)).toBe(true);
  });

  it("rechaza transcripción vacía o en blanco", () => {
    expect(isStorableClip({ ...ok, text: "   " })).toBe(false);
  });

  it("acepta 60 s justos y rechaza más de 60 s", () => {
    expect(isStorableClip({ ...ok, durationMs: 60_000 })).toBe(true);
    expect(isStorableClip({ ...ok, durationMs: 60_001 })).toBe(false);
  });

  it("rechaza duración no positiva o bytes fuera de rango", () => {
    expect(isStorableClip({ ...ok, durationMs: 0 })).toBe(false);
    expect(isStorableClip({ ...ok, bytes: 0 })).toBe(false);
    expect(isStorableClip({ ...ok, bytes: MAX_CLIP_BYTES + 1 })).toBe(false);
    expect(isStorableClip({ ...ok, bytes: MAX_CLIP_BYTES })).toBe(true);
  });
});
