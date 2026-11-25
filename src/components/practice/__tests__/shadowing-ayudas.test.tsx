/**
 * Ayudas del shadowing (#357, T5): velocidad del audio y traducción al español
 * de cada frase en tooltip.
 */
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";

vi.mock("@/interface/emma-context", () => ({ useEmma: () => ({ profile: { englishLevel: "A1" } }) }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("") }));

import { SpeedPicker, TranslationHint } from "@/components/practice/shadowing-parts";

describe("SpeedPicker", () => {
  it("ofrece 1×, 0.75× y 0.5× con tooltip y marca la elegida", () => {
    const html = renderToStaticMarkup(<SpeedPicker value={0.75} onChange={vi.fn()} />);
    for (const s of ["1×", "0.75×", "0.5×"]) expect(html).toContain(s);
    expect(html).toContain('aria-pressed="true"');
    expect((html.match(/title="/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});

describe("TranslationHint", () => {
  it("es un botón ES con tooltip en español", () => {
    const html = renderToStaticMarkup(<TranslationHint sentence="I fix small bugs." />);
    expect(html).toContain("ES");
    expect(html).toMatch(/title="[^"]*(traducción|Traducción)/);
  });
});

describe("cableado", () => {
  it("SpeakButton y useKaraoke aceptan velocidad", () => {
    expect(fs.readFileSync("src/components/chat/speak-button.tsx", "utf8")).toMatch(/rate\?: number/);
    expect(fs.readFileSync("src/components/chat/use-karaoke.ts", "utf8")).toMatch(/playbackRate = rate/);
  });

  it("el shadowing usa el texto del nivel del aprendiz", () => {
    expect(fs.readFileSync("src/components/practice/minimal-pair-lab.tsx", "utf8")).toMatch(/shadowingTextFor\(level\)/);
  });
});
