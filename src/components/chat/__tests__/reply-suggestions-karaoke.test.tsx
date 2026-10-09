/**
 * #196 — las «Reply suggestions» de Teach me pasan de SpeakButton + span plano
 * a `KaraokeLine` (botón + resalte mientras suena), sin perder la badge de
 * nota (p.ej. «Casual»). `use-karaoke` se mockea, como en karaoke-visible.test.tsx.
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReplySuggestion } from "@/domain/english-teacher/teaching-models";

vi.mock("@/components/chat/use-karaoke", () => ({
  useKaraoke: () => ({
    sentences: [
      { text: "I'll have a coffee.", speakText: "I'll have a coffee.", wordStart: 0, wordCount: 4 },
    ],
    activeSentence: 0,
    activeWord: 1,
    playing: false,
    loading: false,
    available: true,
    canSeek: true,
    play: () => {},
    playSentence: () => {},
    stop: () => {},
  }),
}));

import { ReplySuggestions } from "@/components/chat/teach-panel";

const REPLIES: ReplySuggestion[] = [
  { english: "I'll have a coffee.", note: "Casual" },
  { english: "Could I get a coffee, please?", note: "" },
];

const html = renderToStaticMarkup(createElement(ReplySuggestions, { replies: REPLIES }));

describe("ReplySuggestions", () => {
  it("cada sugerencia se lee en karaoke (resalte de oración/palabra disponible)", () => {
    expect(html).toContain("Listen to pronunciation");
  });

  it("conserva la badge de nota cuando existe", () => {
    expect(html).toContain("Casual");
  });

  it("las sugerencias sin nota no rompen el render", () => {
    // El fake de useKaraoke ignora el texto recibido (siempre la misma escena);
    // lo que importa aquí es que la segunda fila (sin note) no reviente el render.
    const matches = html.match(/Listen to pronunciation/g) ?? [];
    expect(matches.length).toBe(2);
  });
});
