import { describe, it, expect } from "vitest";
import { checkSpokenAttempt } from "../check-pronunciation-use-case";
import type { Transcribe } from "@/domain/audio/i-transcribe";

const fakeTranscribe: Transcribe = async () => "I need to leave";

describe("checkSpokenAttempt", () => {
  it("transcribe el audio y devuelve el veredicto de pronunciación", async () => {
    const res = await checkSpokenAttempt({
      transcribe: fakeTranscribe,
      audio: [0, 0, 0],
      target: "I need to leave",
    });
    expect(res.transcript).toBe("I need to leave");
    expect(res.score).toBe(1);
    expect(res.missedWords).toEqual([]);
  });

  it("propaga la palabra mal transcrita como veredicto fallido", async () => {
    const heardLive: Transcribe = async () => "I need to live";
    const res = await checkSpokenAttempt({
      transcribe: heardLive,
      audio: [0, 0, 0],
      target: "I need to leave",
    });
    expect(res.missedWords).toEqual(["leave"]);
  });

  it("rechaza un objetivo vacío (guard clause)", async () => {
    await expect(
      checkSpokenAttempt({ transcribe: fakeTranscribe, audio: [0], target: "" }),
    ).rejects.toThrow();
  });

  it("degrada a transcripción vacía si el ASR falla, sin romper el flujo", async () => {
    const failing: Transcribe = async () => {
      throw new Error("boom");
    };
    const res = await checkSpokenAttempt({
      transcribe: failing,
      audio: [0],
      target: "I need to leave",
    });
    expect(res.transcript).toBe("");
    expect(res.score).toBe(0);
    expect(res.missedWords).toEqual(["i", "need", "to", "leave"]);
  });
});
