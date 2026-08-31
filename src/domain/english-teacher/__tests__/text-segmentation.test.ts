import { describe, it, expect } from "vitest";
import {
  segmentForPronunciation,
  MAX_WORDS,
  MAX_CHUNKS,
} from "../text-segmentation";

describe("segmentForPronunciation", () => {
  it("divide en oraciones completas por puntuación final", () => {
    expect(segmentForPronunciation("Hello there. How are you?")).toEqual([
      "Hello there",
      "How are you",
    ]);
  });

  it("mantiene las comas dentro de la misma oración", () => {
    expect(segmentForPronunciation("Well, I think so.")).toEqual(["Well, I think so"]);
  });

  it("colapsa los espacios en blanco al reconstruir la oración", () => {
    expect(segmentForPronunciation("hello   there")).toEqual(["hello there"]);
  });

  it("sub-divide una oración que supera maxWords", () => {
    const words = Array.from({ length: MAX_WORDS + 3 }, (_, i) => `w${i}`);
    const chunks = segmentForPronunciation(words.join(" "));
    expect(chunks).toHaveLength(2);
    expect(chunks[0].split(" ")).toHaveLength(MAX_WORDS);
    expect(chunks[1].split(" ")).toHaveLength(3);
  });

  it("respeta un maxWords personalizado", () => {
    expect(segmentForPronunciation("one two three four", 2)).toEqual([
      "one two",
      "three four",
    ]);
  });

  it("descarta trozos sin ninguna letra", () => {
    expect(segmentForPronunciation("123 456")).toEqual([]);
  });

  it("conserva trozos que mezclan letras y símbolos", () => {
    expect(segmentForPronunciation("plan B")).toEqual(["plan B"]);
  });

  it("devuelve lista vacía para texto vacío", () => {
    expect(segmentForPronunciation("")).toEqual([]);
  });

  it("devuelve lista vacía para texto de solo espacios", () => {
    expect(segmentForPronunciation("   ")).toEqual([]);
  });

  it("limita a MAX_CHUNKS oraciones como máximo", () => {
    const text = Array.from({ length: MAX_CHUNKS + 5 }, (_, i) => `sentence${i}.`).join(" ");
    expect(segmentForPronunciation(text)).toHaveLength(MAX_CHUNKS);
  });
});
