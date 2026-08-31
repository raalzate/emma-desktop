import { describe, it, expect } from "vitest";
import {
  normalizeSpoken,
  checkPronunciation,
  isIntelligible,
} from "../pronunciation-check";

describe("normalizeSpoken", () => {
  it("pasa a minúsculas, quita puntuación y colapsa espacios", () => {
    expect(normalizeSpoken("  I  Need,  to Leave!! ")).toBe("i need to leave");
  });
});

describe("checkPronunciation", () => {
  it("marca todas las palabras correctas cuando la transcripción coincide", () => {
    const res = checkPronunciation("I need to leave", "I need to leave");
    expect(res.score).toBe(1);
    expect(res.missedWords).toEqual([]);
    expect(res.verdicts).toEqual([
      { expected: "i", heard: "i", ok: true },
      { expected: "need", heard: "need", ok: true },
      { expected: "to", heard: "to", ok: true },
      { expected: "leave", heard: "leave", ok: true },
    ]);
  });

  it("marca la palabra clave mal transcrita (leave -> live)", () => {
    const res = checkPronunciation("I need to leave", "I need to live");
    expect(res.missedWords).toEqual(["leave"]);
    expect(res.score).toBe(0.75); // 3 de 4 palabras correctas
    const leaveVerdict = res.verdicts.find((v) => v.expected === "leave");
    expect(leaveVerdict).toEqual({ expected: "leave", heard: "live", ok: false });
  });

  it("tolera que el ASR omita una palabra sin descuadrar el resto", () => {
    const res = checkPronunciation("I need to leave now", "I need leave now");
    expect(res.missedWords).toEqual(["to"]);
    expect(res.score).toBe(0.8); // 4 de 5 palabras correctas
  });

  it("tolera que el ASR añada una palabra extra sin descuadrar el resto", () => {
    const res = checkPronunciation("I need to leave", "I really need to leave");
    expect(res.missedWords).toEqual([]);
    expect(res.score).toBe(1);
  });

  it("ignora puntuación y mayúsculas al comparar", () => {
    const res = checkPronunciation("I need to leave.", "i, NEED to LEAVE!");
    expect(res.score).toBe(1);
    expect(res.missedWords).toEqual([]);
  });

  it("lanza error con objetivo vacío (guard clause)", () => {
    expect(() => checkPronunciation("", "algo")).toThrow();
    expect(() => checkPronunciation("   ", "algo")).toThrow();
  });

  it("marca todo como no oído cuando la transcripción está vacía", () => {
    const res = checkPronunciation("I need to leave", "");
    expect(res.score).toBe(0);
    expect(res.missedWords).toEqual(["i", "need", "to", "leave"]);
    expect(res.verdicts.every((v) => v.heard === null && !v.ok)).toBe(true);
  });
});

describe("isIntelligible", () => {
  it("considera inteligible un puntaje de 0.8 o más (umbral documentado)", () => {
    expect(isIntelligible(0.8)).toBe(true);
    expect(isIntelligible(1)).toBe(true);
  });

  it("no considera inteligible un puntaje por debajo del umbral", () => {
    expect(isIntelligible(0.79)).toBe(false);
    expect(isIntelligible(0)).toBe(false);
  });
});
