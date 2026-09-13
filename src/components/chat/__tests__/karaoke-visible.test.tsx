/**
 * BUG: «no aparece el efecto karaoke». El resaltado era por ORACIÓN con
 * `bg-primary-soft` (#E4EAF4) sobre tarjeta blanca: en un mensaje de una o dos
 * oraciones no se percibía nada moviéndose. Ahora la palabra que suena se
 * resalta con contraste real y la oración activa mantiene el fondo suave; la
 * transcripción además sube de tamaño (se lee mientras se escucha).
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/chat/use-karaoke", () => ({
  useKaraoke: () => ({
    sentences: [
      { text: "Good morning!", speakText: "Good morning!", wordStart: 0, wordCount: 2 },
      { text: "What can I get you?", speakText: "What can I get you?", wordStart: 2, wordCount: 5 },
    ],
    activeSentence: 1,
    activeWord: 3, // "can"
    playing: true,
    loading: false,
    available: true,
    canSeek: true,
    play: () => {},
    playSentence: () => {},
    stop: () => {},
  }),
}));

import { EmmaBubble } from "@/components/chat/emma-bubble";

const html = () =>
  renderToStaticMarkup(
    createElement(EmmaBubble, { text: "Good morning! What can I get you?", at: Date.now() }),
  );

describe("EmmaBubble — karaoke visible", () => {
  it("resalta la PALABRA que suena con contraste real", () => {
    const out = html();
    const marca = out.match(/<span[^>]*bg-primary[^>]*>can\s*<\/span>/);
    expect(marca, out).not.toBeNull();
    expect(marca![0]).toContain("text-primary-foreground");
  });

  it("la oración activa conserva el fondo azul suave del token (FR-016)", () => {
    expect(html()).toContain("bg-primary-soft");
  });

  it("la transcripción se lee más grande que el text-sm anterior", () => {
    expect(html()).toMatch(/text-\[15px\]|text-base/);
  });
});
