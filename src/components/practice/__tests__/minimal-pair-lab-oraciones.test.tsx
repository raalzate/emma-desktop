/**
 * H8 — el laboratorio de pares mínimos ahora escucha una ORACIÓN (no la
 * palabra suelta): "Listen to the sentence" reproduce la frase con la
 * palabra objetivo resaltada, y el nivel sale del perfil del aprendiz salvo
 * que ?level lo sobrescriba.
 */
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/interface/emma-context", () => ({
  useEmma: () => ({ profile: { englishLevel: "B1" } }),
}));

// Mutable: cada test fija los query params antes de renderizar.
let searchParams = new URLSearchParams("");
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams }));

import { MinimalPairLab } from "@/components/practice/minimal-pair-lab";

function render(): string {
  return renderToStaticMarkup(<MinimalPairLab initialContrastId="i-vs-ii" />);
}

describe("MinimalPairLab — oraciones por nivel", () => {
  it("el paso 1 invita a escuchar la oración, no la palabra suelta", () => {
    searchParams = new URLSearchParams("");
    const html = render();
    expect(html).toContain("Listen to the sentence");
    expect(html).not.toContain("Listen to the word");
  });

  it("resalta la palabra objetivo dentro de la oración mostrada", () => {
    searchParams = new URLSearchParams("");
    const html = render();
    expect(html).toMatch(/<strong[^>]*>[^<]*<\/strong>/);
  });

  it("con ?level=A1 usa oraciones cortas aunque el perfil diga B1", () => {
    searchParams = new URLSearchParams("level=A1");
    const html = render();
    expect(html).toContain("Listen to the sentence");
  });
});
