/**
 * #196 (H2) — la transcripción de la burbuja de Emma arranca CERRADA: con la
 * lección ya en karaoke en varias vistas, tener el texto siempre abierto
 * duplicaba el resalte y alargaba cada burbuja sin que el aprendiz lo pidiera.
 * Sigue siendo un clic para abrirla (o pulsar play, que ya la abre).
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/chat/use-karaoke", () => ({
  useKaraoke: () => ({
    sentences: [{ text: "Good morning!", speakText: "Good morning!", wordStart: 0, wordCount: 2 }],
    activeSentence: -1,
    activeWord: -1,
    playing: false,
    loading: false,
    available: true,
    canSeek: true,
    play: () => {},
    playSentence: () => {},
    stop: () => {},
  }),
}));

import { EmmaBubble } from "@/components/chat/emma-bubble";

const render = () =>
  renderToStaticMarkup(createElement(EmmaBubble, { text: "Good morning!", at: Date.now() }));

describe("EmmaBubble — transcripción colapsada por defecto", () => {
  it("no muestra la transcripción hasta que el aprendiz la pide", () => {
    // KaraokeTranscript siempre monta su <p> raíz con esta clase; su ausencia
    // confirma que el bloque ni se renderiza mientras está cerrado.
    expect(render()).not.toContain("mt-2 text-[15px] leading-relaxed");
  });
});
