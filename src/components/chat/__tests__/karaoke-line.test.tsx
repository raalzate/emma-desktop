/**
 * #196 — `KaraokeLine` es el bloque reusable: botón de play + el texto en
 * inglés resaltado con karaoke mientras suena. Nace para no repetir
 * `SpeakButton` + `<span>` plano en Teach me y Translate (y, a futuro, en las
 * burbujas de Emma). `useKaraoke` toca APIs de navegador: se mockea el módulo,
 * como en `karaoke-visible.test.tsx`.
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/chat/use-karaoke", () => ({
  useKaraoke: () => ({
    sentences: [
      { text: "Good morning!", speakText: "Good morning!", wordStart: 0, wordCount: 2 },
    ],
    activeSentence: 0,
    activeWord: 1, // "morning"
    playing: true,
    loading: false,
    available: true,
    canSeek: true,
    play: () => {},
    playSentence: () => {},
    stop: () => {},
  }),
}));

import { KaraokeLine } from "@/components/chat/karaoke-line";

const render = (over: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(KaraokeLine, { text: "Good morning!", ...over }));

describe("KaraokeLine", () => {
  it("resalta la palabra que suena mientras reproduce", () => {
    const html = render();
    const marca = html.match(/<span[^>]*bg-primary[^>]*>morning!\s*<\/span>/);
    expect(marca, html).not.toBeNull();
  });

  it("el botón de audio lleva tooltip en español (Art. 9)", () => {
    expect(render()).toMatch(/title="Detén la reproducción"/);
  });

  it("acepta un slot final para contenido adicional (p.ej. una badge)", () => {
    const html = render({ trailing: createElement("span", { key: "n" }, "Casual") });
    expect(html).toContain("Casual");
  });

  it("sin slot final no rompe el render", () => {
    expect(() => render()).not.toThrow();
  });
});
