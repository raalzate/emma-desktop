import { describe, it, expect } from "vitest";
import {
  buildKaraokeScript,
  sentenceIndexAtWord,
  sentenceStartTime,
  sentenceEndTime,
  type SentenceSpan,
} from "../transcript-sentences";

describe("buildKaraokeScript", () => {
  it("segmenta oraciones simples por terminador", () => {
    const { sentences } = buildKaraokeScript("Hello there. How are you?");
    expect(sentences.map((s) => s.text)).toEqual(["Hello there.", "How are you?"]);
  });

  it("no parte oraciones por abreviaturas comunes", () => {
    const { sentences } = buildKaraokeScript(
      "I like fruits, e.g. apples and pears. Dr. Smith agrees.",
    );
    expect(sentences.map((s) => s.text)).toEqual([
      "I like fruits, e.g. apples and pears.",
      "Dr. Smith agrees.",
    ]);
  });

  it("no parte oraciones por números decimales", () => {
    const { sentences } = buildKaraokeScript("The price is 3.5 dollars. That's fair.");
    expect(sentences.map((s) => s.text)).toEqual([
      "The price is 3.5 dollars.",
      "That's fair.",
    ]);
  });

  it("incluye la última oración sin terminador", () => {
    const { sentences } = buildKaraokeScript("First one. And a trailing thought");
    expect(sentences.map((s) => s.text)).toEqual([
      "First one.",
      "And a trailing thought",
    ]);
  });

  it("calcula speakText por oración y el speakText global uniendo las no vacías", () => {
    const { speakText, sentences } = buildKaraokeScript(
      "Great job! Keep going.",
    );
    expect(sentences[0].speakText).toBe("Great job!");
    expect(sentences[1].speakText).toBe("Keep going.");
    expect(speakText).toBe("Great job! Keep going.");
  });

  it("descarta del audio una oración enteramente simbólica pero la conserva visible con wordCount 0", () => {
    const { speakText, sentences } = buildKaraokeScript(
      "Great job! 😊😊😊! Keep going.",
    );
    expect(sentences).toHaveLength(3);
    expect(sentences[1].text).toBe("😊😊😊!");
    expect(sentences[1].wordCount).toBe(0);
    expect(sentences[1].speakText).toBe("");
    // La oración simbólica no debe aportar palabras al audio global.
    expect(speakText).toBe("Great job! Keep going.");
  });

  it("calcula wordStart/wordCount acumulados sobre el speakText global con oración simbólica intercalada", () => {
    const { sentences } = buildKaraokeScript("Great job! 😊😊😊! Keep going now.");
    // "Great job!" -> 2 palabras hablables (índices 0,1)
    expect(sentences[0]).toMatchObject({ wordStart: 0, wordCount: 2 });
    // oración simbólica: sin palabras, wordStart apunta al mismo punto que la siguiente
    expect(sentences[1]).toMatchObject({ wordStart: 2, wordCount: 0 });
    // "Keep going now." -> 3 palabras hablables, continúa desde el índice 2
    expect(sentences[2]).toMatchObject({ wordStart: 2, wordCount: 3 });
  });

  it("mensaje 100% emoji produce speakText global vacío y una única oración con wordCount 0", () => {
    const { speakText, sentences } = buildKaraokeScript("😊😂🎉");
    expect(speakText).toBe("");
    expect(sentences).toHaveLength(1);
    expect(sentences[0].wordCount).toBe(0);
  });
});

describe("sentenceIndexAtWord", () => {
  const sentences: SentenceSpan[] = [
    { text: "Great job!", speakText: "Great job!", wordStart: 0, wordCount: 2 },
    { text: "😊😊😊!", speakText: "", wordStart: 2, wordCount: 0 },
    { text: "Keep going now.", speakText: "Keep going now.", wordStart: 2, wordCount: 3 },
  ];

  it("encuentra la oración que contiene el índice de palabra", () => {
    expect(sentenceIndexAtWord(sentences, 0)).toBe(0);
    expect(sentenceIndexAtWord(sentences, 1)).toBe(0);
    expect(sentenceIndexAtWord(sentences, 2)).toBe(2);
    expect(sentenceIndexAtWord(sentences, 4)).toBe(2);
  });

  it("devuelve -1 si el índice no cae en ninguna oración", () => {
    expect(sentenceIndexAtWord(sentences, -1)).toBe(-1);
    expect(sentenceIndexAtWord(sentences, 5)).toBe(-1);
  });
});

describe("sentenceStartTime", () => {
  const timings = [
    { start: 0, end: 0.3 },
    { start: 0.3, end: 0.6 },
    { start: 0.6, end: 0.9 },
  ];

  it("devuelve el start del timing en wordStart", () => {
    const s: SentenceSpan = { text: "a", speakText: "a", wordStart: 1, wordCount: 2 };
    expect(sentenceStartTime(s, timings)).toBe(0.3);
  });

  it("devuelve null cuando wordCount es 0", () => {
    const s: SentenceSpan = { text: "a", speakText: "", wordStart: 1, wordCount: 0 };
    expect(sentenceStartTime(s, timings)).toBeNull();
  });

  it("devuelve null cuando wordStart está fuera de rango", () => {
    const s: SentenceSpan = { text: "a", speakText: "a", wordStart: 10, wordCount: 1 };
    expect(sentenceStartTime(s, timings)).toBeNull();
  });
});

describe("sentenceEndTime", () => {
  const timings = [
    { start: 0, end: 0.3 },
    { start: 0.3, end: 0.6 },
    { start: 0.6, end: 0.9 },
  ];

  it("devuelve el end del timing de la última palabra de la oración", () => {
    const s: SentenceSpan = { text: "a", speakText: "a", wordStart: 0, wordCount: 2 };
    expect(sentenceEndTime(s, timings)).toBe(0.6);
  });

  it("devuelve null cuando wordCount es 0", () => {
    const s: SentenceSpan = { text: "a", speakText: "", wordStart: 1, wordCount: 0 };
    expect(sentenceEndTime(s, timings)).toBeNull();
  });

  it("devuelve null cuando la última palabra queda fuera de los timings", () => {
    const s: SentenceSpan = { text: "a", speakText: "a", wordStart: 2, wordCount: 3 };
    expect(sentenceEndTime(s, timings)).toBeNull();
  });
});
