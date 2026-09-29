/**
 * #196 — Translate muestra la línea en inglés en karaoke (`KaraokeLine`); la
 * traducción al español queda estática debajo, fuera del resalte.
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { BilingualPair } from "@/domain/translation/translation-prompt";

vi.mock("@/components/chat/use-karaoke", () => ({
  useKaraoke: () => ({
    sentences: [
      { text: "Good morning!", speakText: "Good morning!", wordStart: 0, wordCount: 2 },
    ],
    activeSentence: 0,
    activeWord: 0,
    playing: false,
    loading: false,
    available: true,
    canSeek: true,
    play: () => {},
    playSentence: () => {},
    stop: () => {},
  }),
}));

import { TranslationPairs } from "@/components/chat/translate-dialog";

const PAIRS: BilingualPair[] = [{ source: "Good morning!", target: "¡Buenos días!" }];

const html = renderToStaticMarkup(createElement(TranslationPairs, { pairs: PAIRS }));

describe("TranslationPairs", () => {
  it("la línea en inglés se lee en karaoke (botón de audio disponible)", () => {
    expect(html).toContain("Listen to pronunciation");
  });

  it("la traducción al español queda estática, fuera del bloque resaltado", () => {
    expect(html).toContain("¡Buenos días!");
    // El español no debe llevar el resalte de palabra activa del karaoke.
    const targetIdx = html.indexOf("¡Buenos días!");
    const before = html.slice(0, targetIdx);
    const lastKaraokeClose = before.lastIndexOf("</p>");
    expect(lastKaraokeClose).toBeLessThan(targetIdx);
  });
});
