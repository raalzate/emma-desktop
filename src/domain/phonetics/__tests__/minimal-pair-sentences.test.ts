/**
 * Oraciones cortas por nivel para pares mínimos (H8): cada palabra del par
 * consigue una oración natural por banda (short/medium/long) que la contiene,
 * para que "Say it" pida pronunciar una frase, no la palabra suelta.
 */
import { describe, it, expect } from "vitest";
import type { MinimalPair } from "@/domain/phonetics/phonetics";
import { SOUND_CONTRASTS } from "@/lib/phonetics-data";
import { bandForLevel, sentenceForPair } from "../minimal-pair-sentences";

function wordCount(sentence: string): number {
  return sentence.trim().split(/\s+/).length;
}

describe("bandForLevel", () => {
  it("A1 y A2 caen en la banda «short»", () => {
    expect(bandForLevel("A1")).toBe("short");
    expect(bandForLevel("A2")).toBe("short");
  });
  it("B1 cae en la banda «medium»", () => {
    expect(bandForLevel("B1")).toBe("medium");
  });
  it("B2 y C1 caen en la banda «long»", () => {
    expect(bandForLevel("B2")).toBe("long");
    expect(bandForLevel("C1")).toBe("long");
  });
});

const bitBeat: MinimalPair = { a: "bit", b: "beat", ipaA: "bɪt", ipaB: "biːt" };

describe("sentenceForPair", () => {
  it("bit (A1): usa la oración corta autorada", () => {
    expect(sentenceForPair(bitBeat, "a", "A1")).toBe("Wait a bit.");
  });
  it("beat (A1): usa la oración corta autorada", () => {
    expect(sentenceForPair(bitBeat, "b", "A1")).toBe("Our team beat the deadline.");
  });
  it("bit (B1): la oración media también contiene la palabra", () => {
    const sentence = sentenceForPair(bitBeat, "a", "B1");
    expect(sentence.toLowerCase()).toMatch(/\bbit\b/);
    const n = wordCount(sentence);
    expect(n).toBeGreaterThanOrEqual(6);
    expect(n).toBeLessThanOrEqual(11);
  });
  it("beat (C1): la oración larga también contiene la palabra", () => {
    const sentence = sentenceForPair(bitBeat, "b", "C1");
    expect(sentence.toLowerCase()).toMatch(/\bbeat\b/);
    const n = wordCount(sentence);
    expect(n).toBeGreaterThanOrEqual(10);
    expect(n).toBeLessThanOrEqual(17);
  });

  it("una palabra sin autoría cae a la plantilla genérica, que sigue conteniendo la palabra", () => {
    const par: MinimalPair = { a: "grid", b: "greed" };
    const sentence = sentenceForPair(par, "a", "A2");
    expect(sentence.toLowerCase()).toContain("grid");
  });

  it("un campo sin letras (par asimétrico) cae al valor crudo, sin lanzar", () => {
    const par: MinimalPair = { a: "bug", b: "—" };
    expect(sentenceForPair(par, "b", "B1")).toBe("—");
  });

  it("extrae la forma hablable de anotaciones entre paréntesis o barras", () => {
    const par: MinimalPair = { a: "cash / cache", b: "cush" };
    const sentence = sentenceForPair(par, "a", "A1");
    expect(sentence.toLowerCase()).toContain("cash");
  });

  for (const contrast of SOUND_CONTRASTS) {
    if (contrast.id === "vowel-atlas") continue;
    describe(`contraste «${contrast.id}»`, () => {
      for (const pair of contrast.pairs) {
        for (const side of ["a", "b"] as const) {
          const raw = side === "a" ? pair.a : pair.b;
          if (!/[a-zA-Z]/.test(raw)) continue; // pares asimétricos ("—"): sin oración que probar
          it(`«${raw}» tiene oración en las 3 bandas y cada una contiene la palabra`, () => {
            const spoken = raw.split(/[/(]/)[0].trim().toLowerCase();
            for (const level of ["A1", "B1", "C1"] as const) {
              const sentence = sentenceForPair(pair, side, level);
              expect(sentence.length).toBeGreaterThan(0);
              expect(sentence.toLowerCase()).toContain(spoken);
            }
          });
        }
      }
    });
  }
});
