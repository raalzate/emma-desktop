import { describe, it, expect } from "vitest";
import { estimateWordTimings } from "../word-timings";
import { buildKaraokeScript, sentenceStartTime, sentenceEndTime } from "@/domain/chat/transcript-sentences";

describe("estimateWordTimings", () => {
  it("devuelve una lista vacía sin texto o sin duración", () => {
    expect(estimateWordTimings("", 3)).toEqual([]);
    expect(estimateWordTimings("   ", 3)).toEqual([]);
    expect(estimateWordTimings("hello", 0)).toEqual([]);
    expect(estimateWordTimings("hello", -2)).toEqual([]);
  });

  it("produce un timing por palabra, con la palabra original", () => {
    const t = estimateWordTimings("Hello brave world", 3);
    expect(t.map((x) => x.word)).toEqual(["Hello", "brave", "world"]);
  });

  it("es contiguo: empieza en 0, cada palabra arranca donde acabó la anterior y termina en la duración", () => {
    const t = estimateWordTimings("Nice to meet you, I am Emma.", 4.2);
    expect(t[0].start).toBe(0);
    for (let i = 1; i < t.length; i++) expect(t[i].start).toBeCloseTo(t[i - 1].end, 9);
    expect(t[t.length - 1].end).toBeCloseTo(4.2, 9);
  });

  it("da más tiempo a la palabra más larga", () => {
    const [short, long] = estimateWordTimings("go extraordinarily", 3);
    expect(long.end - long.start).toBeGreaterThan(short.end - short.start);
  });

  it("agrega una pausa extra tras la puntuación", () => {
    const [plain] = estimateWordTimings("well today", 2);
    const [comma] = estimateWordTimings("well, today", 2);
    const [stop] = estimateWordTimings("well. today", 2);
    const dur = (w: { start: number; end: number }) => w.end - w.start;
    expect(dur(comma)).toBeGreaterThan(dur(plain));
    expect(dur(stop)).toBeGreaterThan(dur(comma));
  });

  it("toda palabra dura algo aunque sea de un solo carácter", () => {
    for (const w of estimateWordTimings("I a x", 1.5)) expect(w.end - w.start).toBeGreaterThan(0);
  });

  it("es compatible con el karaoke: un timing por palabra hablable y fronteras por oración", () => {
    const script = buildKaraokeScript("Hi there! How are you today?");
    const timings = estimateWordTimings(script.speakText, 3);
    expect(timings).toHaveLength(script.sentences.reduce((n, s) => n + s.wordCount, 0));
    const [s1, s2] = script.sentences;
    expect(sentenceStartTime(s1, timings)).toBe(0);
    expect(sentenceEndTime(s1, timings)).toBeCloseTo(sentenceStartTime(s2, timings)!, 9);
    expect(sentenceEndTime(s2, timings)).toBeCloseTo(3, 9);
  });
});
