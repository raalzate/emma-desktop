/**
 * BUG: el karaoke no se veía. El resaltado era por ORACIÓN con un fondo casi
 * blanco (#E4EAF4 sobre tarjeta blanca): en un mensaje de una o dos oraciones
 * no se percibía movimiento alguno. El karaoke real es PALABRA a palabra, y
 * para eso la transcripción necesita el índice global de cada palabra visible.
 */

import { describe, expect, it } from "vitest";
import { buildKaraokeScript, sentenceWordTokens } from "@/domain/chat/transcript-sentences";

describe("sentenceWordTokens (karaoke palabra a palabra)", () => {
  it("mapea cada palabra visible a su índice global de palabra hablable", () => {
    const { sentences } = buildKaraokeScript("Hi Raul, ready for standup? Let's go!");
    const primera = sentenceWordTokens(sentences[0]);
    expect(primera.map((t) => t.text)).toEqual(["Hi", "Raul,", "ready", "for", "standup?"]);
    expect(primera.map((t) => t.wordIndex)).toEqual([0, 1, 2, 3, 4]);

    const segunda = sentenceWordTokens(sentences[1]);
    expect(segunda.map((t) => t.text)).toEqual(["Let's", "go!"]);
    expect(segunda.map((t) => t.wordIndex)).toEqual([5, 6]);
  });

  it("sin correspondencia de conteo no inventa índices (resaltado por oración)", () => {
    // El emoji desaparece del texto hablable: los conteos ya no coinciden.
    const { sentences } = buildKaraokeScript("Nice 🎉 work today.");
    const tokens = sentenceWordTokens(sentences[0]);
    expect(tokens.some((t) => t.wordIndex === null)).toBe(true);
  });

  it("una oración sin audio devuelve tokens sin índice", () => {
    const { sentences } = buildKaraokeScript("Ready?!");
    const ultima = sentences[sentences.length - 1];
    if (ultima.wordCount === 0) {
      expect(sentenceWordTokens(ultima).every((t) => t.wordIndex === null)).toBe(true);
    }
  });
});
