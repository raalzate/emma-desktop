/**
 * #171 — la lección de Emma se lee en karaoke y su audio vive en la cabecera de
 * la sección, no arriba del reporte. `useKaraoke` toca APIs de navegador: aquí
 * se le pasa un doble por props, así que el render es estático y determinista.
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LessonKaraoke } from "@/components/chat/lesson-dialog";
import type { Karaoke } from "@/components/chat/use-karaoke";

const LESSON = "Use contractions. Say I'm working on it.";

const karaoke = (over: Partial<Karaoke> = {}): Karaoke => ({
  sentences: [
    { text: "Use contractions.", speakText: "Use contractions.", wordStart: 0, wordCount: 2 },
    {
      text: "Say I'm working on it.",
      speakText: "Say I'm working on it.",
      wordStart: 2,
      wordCount: 5,
    },
  ],
  activeSentence: 1,
  activeWord: 3,
  playing: true,
  loading: false,
  available: true,
  canSeek: true,
  play: vi.fn(),
  playSentence: vi.fn(),
  stop: vi.fn(),
  ...over,
});

const render = (k: Karaoke, lesson = LESSON) =>
  renderToStaticMarkup(
    createElement(LessonKaraoke, { karaoke: k, lesson, onTranslate: () => {} }),
  );

describe("LessonKaraoke", () => {
  it("pone el control de audio en la cabecera de «Lección de Emma», junto a la ayuda en español", () => {
    const html = render(karaoke());
    expect(html).toContain("Lección de Emma");
    expect(html).toContain("Detener");
    expect(html).toContain("Ayuda en español");
    expect(html.indexOf("Lección de Emma")).toBeLessThan(html.indexOf("Ayuda en español"));
  });

  it("resalta la oración activa y la palabra que suena, como el karaoke del chat", () => {
    const html = render(karaoke());
    expect(html).toContain("bg-primary-soft text-primary-deep");
    expect(html).toContain("bg-primary font-semibold text-primary-foreground");
  });

  it("con Edge-TTS cada oración es clicable para repetirla", () => {
    expect(render(karaoke())).toContain('title="Clic para escuchar esta oración"');
  });

  it("sin salto (solo Web Speech) el resalte sigue pero las oraciones no ofrecen clic", () => {
    const html = render(karaoke({ canSeek: false }));
    expect(html).not.toContain("Clic para escuchar esta oración");
    expect(html).toContain("bg-primary-soft text-primary-deep");
  });

  it("sin contenido hablable no aparece control de audio", () => {
    const html = render(karaoke({ sentences: [], activeSentence: -1, activeWord: -1 }), "— …");
    expect(html).not.toContain("Escuchar a Emma");
    expect(html).not.toContain("Detener");
    expect(html).toContain("Ayuda en español");
  });

  it("no autoplay: el control aparece en «Escuchar a Emma» mientras no suena", () => {
    expect(render(karaoke({ playing: false, activeSentence: -1, activeWord: -1 }))).toContain(
      "Escuchar a Emma",
    );
  });
});
