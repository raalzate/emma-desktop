import { describe, expect, it } from "vitest";
import { filterByMode } from "../review-mode";
import type { SrsCard } from "../srs-card";

const card = (id: string, kind: SrsCard["kind"]): SrsCard => ({
  id, kind, box: 1, lastReviewedDay: 0, front: "f", back: "b",
});
const cards = [card("a", "chunk-cloze"), card("b", "audio-recall"), card("c", "sentence-production")];

describe("filterByMode", () => {
  it("text deja todo menos audio-recall", () => {
    expect(filterByMode(cards, "text").map((c) => c.id)).toEqual(["a", "c"]);
  });

  it("audio deja sólo audio-recall", () => {
    expect(filterByMode(cards, "audio").map((c) => c.id)).toEqual(["b"]);
  });

  it("mixed deja todo en el mismo orden", () => {
    expect(filterByMode(cards, "mixed").map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("sin tarjetas de audio, text equivale a no filtrar (comportamiento de hoy)", () => {
    const viejas = [card("a", "chunk-cloze"), card("c", "word-stress")];
    expect(filterByMode(viejas, "text")).toEqual(viejas);
  });
});
