import { describe, expect, it } from "vitest";

import { phrasesForSituation } from "../phrase-bank-catalog";

describe("phrasesForSituation", () => {
  it("devuelve solo frases de la situación pedida", () => {
    const phrases = phrasesForSituation("standup");
    expect(phrases.length).toBeGreaterThan(0);
    for (const p of phrases) expect(p.situation).toBe("standup");
  });

  it("devuelve [] si la situación es undefined", () => {
    expect(phrasesForSituation(undefined)).toEqual([]);
  });
});
