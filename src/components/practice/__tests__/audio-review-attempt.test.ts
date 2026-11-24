/** Guardado del intento de lectura al terminar una tarjeta de audio (FR-014). */
import { describe, expect, it } from "vitest";
import { saveReadingAttempt } from "@/components/practice/audio-review-attempt";

const card = { id: "audio-1", back: "She goes to school" };
const attempt = { data: new Uint8Array([1, 2]), durationMs: 900 };

describe("saveReadingAttempt", () => {
  it("guarda el intento con el texto objetivo de la tarjeta", async () => {
    const calls: unknown[] = [];
    const audio = { recordAttempt: async (a: unknown) => (calls.push(a), "clip-1") };
    expect(await saveReadingAttempt(audio, card, attempt)).toBe("clip-1");
    expect(calls).toEqual([{ cardId: "audio-1", text: "She goes to school", data: attempt.data, durationMs: 900 }]);
  });

  it("sin intento grabado no escribe nada", async () => {
    let called = false;
    const audio = { recordAttempt: async () => ((called = true), null) };
    expect(await saveReadingAttempt(audio, card, null)).toBeNull();
    expect(called).toBe(false);
  });

  it("un fallo del disco no lanza", async () => {
    const audio = { recordAttempt: async () => Promise.reject(new Error("disco lleno")) };
    expect(await saveReadingAttempt(audio, card, attempt)).toBeNull();
  });
});
