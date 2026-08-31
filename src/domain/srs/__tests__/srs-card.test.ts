import { describe, it, expect } from "vitest";
import { buildCardsFromErrors, buildCardFromChunk } from "../srs-card";

describe("buildCardsFromErrors", () => {
  it("crea una tarjeta sentence-production por cada error, caja 1", () => {
    const errors = [{ original: "I go to school yesterday", corrected: "I went to school yesterday" }];
    const cards = buildCardsFromErrors(errors, (i) => `err-${i}`, 5);

    expect(cards).toHaveLength(1);
    expect(cards[0].kind).toBe("sentence-production");
    expect(cards[0].box).toBe(1);
    expect(cards[0].lastReviewedDay).toBe(5);
    expect(cards[0].back).toBe("I went to school yesterday");
    expect(cards[0].front).toContain("I go to school yesterday");
    expect(cards[0].front).toContain("Di esto correctamente:");
  });

  it("acepta un id fijo (string) como prefijo con índice", () => {
    const errors = [
      { original: "a", corrected: "b" },
      { original: "c", corrected: "d" },
    ];
    const cards = buildCardsFromErrors(errors, "err", 0);
    expect(cards.map((c) => c.id)).toEqual(["err-0", "err-1"]);
  });

  it("no duplica tarjetas con el mismo par original/corrected", () => {
    const errors = [
      { original: "I go", corrected: "I went" },
      { original: "I go", corrected: "I went" },
    ];
    const cards = buildCardsFromErrors(errors, "err", 0);
    expect(cards).toHaveLength(1);
  });
});

describe("buildCardFromChunk", () => {
  it("crea una tarjeta chunk-cloze ocultando la palabra clave más larga", () => {
    const chunk = { text: "get used to", functionEs: "acostumbrarse a" };
    const card = buildCardFromChunk(chunk, "chunk-1", 3);

    expect(card.kind).toBe("chunk-cloze");
    expect(card.id).toBe("chunk-1");
    expect(card.box).toBe(1);
    expect(card.lastReviewedDay).toBe(3);
    expect(card.back).toBe("get used to");
    expect(card.front).toContain("___");
    expect(card.front).toContain("acostumbrarse a");
    expect(card.front).not.toContain("used");
  });
});
