/**
 * FR-015/016/017 (rediseño «Café sereno»): la burbuja de Emma es superficie
 * blanca con borde y radio 16px (esquina superior izquierda 4px), el karaoke
 * resalta con azul suave (token, no bg-primary/20), el play es circular azul y
 * las acciones «Enséñame»/«Traducir» son ghost azules con Tooltip Radix en
 * español (sin `title` nativo).
 *
 * `useKaraoke` toca APIs de navegador vía sus adaptadores TTS: se mockea para
 * render estático en node.
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

vi.mock("@/components/chat/use-karaoke", () => ({
  useKaraoke: () => ({
    sentences: [
      { text: "Good morning!", wordCount: 2 },
      { text: "What can I get you?", wordCount: 5 },
    ],
    activeSentence: 0,
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

function render(): string {
  return renderToStaticMarkup(
    createElement(EmmaBubble, {
      text: "Good morning! What can I get you?",
      at: Date.now(),
      onTeach: () => {},
      onTranslate: () => {},
    }),
  );
}

const src = () =>
  fs.readFileSync(path.join(process.cwd(), "src/components/chat/emma-bubble.tsx"), "utf8");

describe("EmmaBubble (rediseño Café sereno)", () => {
  it("la burbuja es tarjeta con borde y radio bubble con esquina superior izquierda 4px (FR-015)", () => {
    const html = render();
    expect(html).toContain("bg-card");
    expect(html).toContain("border-border");
    expect(html).toContain("rounded-bubble");
    expect(html).toContain("rounded-tl-[4px]");
  });

  it("el karaoke resalta la oración activa con azul suave del token (FR-016)", () => {
    expect(render()).toContain("bg-primary-soft");
    expect(src()).not.toContain("bg-primary/20");
    expect(src()).not.toContain("bg-primary/10");
  });

  it("el play es circular azul y la hora va en mono (FR-015)", () => {
    const html = render();
    expect(html).toMatch(/rounded-full[^"]*bg-primary|bg-primary[^"]*rounded-full/);
    expect(html).toContain("font-code");
  });

  it("las acciones van en español, ghost azul y con Tooltip Radix en vez de title (FR-017)", () => {
    const html = render();
    expect(html).toContain("Enséñame");
    expect(html).toContain("Traducir");
    expect(html).not.toContain("Teach me");
    expect(html).not.toContain("Translate");
    expect(html).toContain("text-primary");
    // El title nativo desaparece de las dos acciones; el globo vive en Tooltip.
    expect(html).not.toContain("Explicación en español");
    const fuente = src();
    expect(fuente).toContain("@/components/ui/tooltip");
    expect(fuente).toContain("Explicación en español: vocabulario y gramática de este mensaje");
    expect(fuente).toContain("Traducir este mensaje al español");
  });
});
