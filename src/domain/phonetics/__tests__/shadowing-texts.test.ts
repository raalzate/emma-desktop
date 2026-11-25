/**
 * Shadowing según el nivel (#357, T6): el texto del libro («Before we ship this
 * release…», «The cache invalidation still fails intermittently under load…»)
 * es inalcanzable para A1–A2. Cada nivel tiene su texto.
 */
import { describe, expect, it } from "vitest";
import { shadowingTextFor } from "../shadowing-texts";

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe("shadowingTextFor", () => {
  it.each(["A1", "A2"] as const)("%s: frases cortas (≤ 10 palabras) y nada de jerga pesada", (level) => {
    const t = shadowingTextFor(level);
    expect(t.sentences.length).toBeGreaterThanOrEqual(3);
    for (const s of t.sentences) expect(words(s)).toBeLessThanOrEqual(10);
    expect(t.text).not.toMatch(/intermittently|invalidation|instrumentation/);
  });

  it("B1: frases medias (≤ 14 palabras)", () => {
    for (const s of shadowingTextFor("B1").sentences) expect(words(s)).toBeLessThanOrEqual(14);
  });

  it("B2 en adelante usa el texto completo del libro", () => {
    expect(shadowingTextFor("B2").text).toMatch(/Before we ship this release/);
    expect(shadowingTextFor("C1").text).toMatch(/Before we ship this release/);
  });

  it("el texto se arma con sus frases", () => {
    const t = shadowingTextFor("A1");
    expect(t.text).toBe(t.sentences.join(" "));
  });
});
