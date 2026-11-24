import { describe, expect, it } from "vitest";
import { countDueByMode, filterByMode } from "../review-mode";
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

describe("countDueByMode", () => {
  const vencida = (id: string, kind: SrsCard["kind"]): SrsCard => ({ ...card(id, kind), box: 1, lastReviewedDay: 0 });
  const reciente = (id: string, kind: SrsCard["kind"]): SrsCard => ({ ...card(id, kind), box: 5, lastReviewedDay: 99 });

  it("cuenta las vencidas por modo sin tope de sesión", () => {
    const muchas = Array.from({ length: 40 }, (_, i) => vencida(`a${i}`, "audio-recall"));
    const todas = [...muchas, vencida("t1", "chunk-cloze"), vencida("t2", "word-stress")];
    expect(countDueByMode(todas, 100)).toEqual({ text: 2, audio: 40, mixed: 42 });
  });

  it("ignora las que aún no vencen", () => {
    const todas = [vencida("a", "audio-recall"), reciente("b", "audio-recall"), reciente("c", "chunk-cloze")];
    expect(countDueByMode(todas, 100)).toEqual({ text: 0, audio: 1, mixed: 1 });
  });

  it("no cuenta las reformulaciones que el repaso salta (no enseñables)", () => {
    const reformulada: SrsCard = {
      ...vencida("r", "sentence-production"),
      front: 'Write this sentence correctly: "He go home"',
      back: "He go home",
    };
    expect(countDueByMode([reformulada], 100).text).toBe(0);
  });

  it("sin tarjetas devuelve ceros", () => {
    expect(countDueByMode([], 100)).toEqual({ text: 0, audio: 0, mixed: 0 });
  });
});
