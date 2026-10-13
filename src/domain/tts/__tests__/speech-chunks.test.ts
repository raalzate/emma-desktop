import { describe, it, expect } from "vitest";
import { planSpeechChunks, offsetTimings, chunkIndexAtTime } from "../speech-chunks";
import { buildKaraokeScript } from "@/domain/chat/transcript-sentences";

describe("planSpeechChunks", () => {
  it("texto vacío o sin contenido hablable no genera trozos", () => {
    expect(planSpeechChunks("")).toEqual([]);
    expect(planSpeechChunks("  ...  !! ")).toEqual([]);
  });

  it("una sola oración es un solo trozo", () => {
    expect(planSpeechChunks("Tell me about your day.")).toEqual([
      { text: "Tell me about your day.", wordStart: 0, wordCount: 5 },
    ]);
  });

  it("separa por oración: la primera es su propio trozo para que el audio arranque pronto", () => {
    const chunks = planSpeechChunks("Tell me about your day. What did you do at work? I am curious.");
    expect(chunks.map((c) => c.text)).toEqual([
      "Tell me about your day.",
      "What did you do at work?",
      "I am curious.",
    ]);
  });

  it("los trozos son contiguos y calzan con las palabras del karaoke", () => {
    const text = "Tell me about your day. What did you do at work? I am curious.";
    const script = buildKaraokeScript(text);
    const chunks = planSpeechChunks(text);
    expect(chunks.map((c) => c.text).join(" ")).toBe(script.speakText);
    let cursor = 0;
    for (const c of chunks) {
      expect(c.wordStart).toBe(cursor);
      expect(c.text.split(/\s+/)).toHaveLength(c.wordCount);
      cursor += c.wordCount;
    }
    expect(cursor).toBe(script.speakText.split(/\s+/).length);
  });

  it("una oración muy corta se une a la siguiente para no cortar el ritmo", () => {
    const chunks = planSpeechChunks("Hi! How are you doing today? I am doing fine, thanks.");
    expect(chunks.map((c) => c.text)).toEqual(["Hi! How are you doing today?", "I am doing fine, thanks."]);
  });

  it("una oración corta al final se une a la anterior", () => {
    const chunks = planSpeechChunks("How are you doing today? Fine.");
    expect(chunks.map((c) => c.text)).toEqual(["How are you doing today? Fine."]);
  });

  it("ignora oraciones sin contenido hablable (emojis, puntuación suelta)", () => {
    const chunks = planSpeechChunks("Tell me about your day. 😊 What did you do?");
    expect(chunks.map((c) => c.text.includes("😊"))).toEqual([false, false]);
    expect(chunks.reduce((n, c) => n + c.wordCount, 0)).toBe(9);
  });
});

describe("offsetTimings", () => {
  it("desplaza start y end por el offset acumulado sin mutar la entrada", () => {
    const original = [{ word: "hi", start: 0, end: 0.5 }];
    expect(offsetTimings(original, 2)).toEqual([{ word: "hi", start: 2, end: 2.5 }]);
    expect(original[0].start).toBe(0);
  });
});

describe("chunkIndexAtTime", () => {
  // offsets de inicio de cada trozo: 0, 2.5, 6
  const starts = [0, 2.5, 6];
  it("devuelve el trozo cuyo intervalo contiene el tiempo", () => {
    expect(chunkIndexAtTime(starts, 0)).toBe(0);
    expect(chunkIndexAtTime(starts, 2.49)).toBe(0);
    expect(chunkIndexAtTime(starts, 2.5)).toBe(1);
    expect(chunkIndexAtTime(starts, 99)).toBe(2);
  });
  it("sin trozos devuelve -1", () => {
    expect(chunkIndexAtTime([], 1)).toBe(-1);
  });
});
