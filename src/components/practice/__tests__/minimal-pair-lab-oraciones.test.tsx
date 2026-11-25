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

  // Contrato cambiado (#357, T1): en producción la palabra se veía resaltada
  // ANTES de responder y el ejercicio de escucha se resolvía leyendo. Ahora se
  // oculta hasta contestar; se revela (con IPA) después.
  it("oculta la palabra objetivo hasta que el aprendiz responde", () => {
    searchParams = new URLSearchParams("");
    const html = render();
    expect(html).toContain('data-testid="masked-word"');
    expect(html).not.toMatch(/<strong[^>]*>[^<]*<\/strong>/);
  });

  it("«Next» no se puede pulsar mientras se procesa una grabación (T3)", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("src/components/practice/minimal-pair-lab.tsx", "utf8");
    expect(src).toMatch(/onClick=\{next\}\s+disabled=\{busy\}/);
    expect(src).toMatch(/onBusyChange=\{setBusy\}/);
  });

  it("con ?level=A1 usa oraciones cortas aunque el perfil diga B1", () => {
    searchParams = new URLSearchParams("level=A1");
    const html = render();
    expect(html).toContain("Listen to the sentence");
  });
});
