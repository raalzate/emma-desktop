/**
 * FR-021/022 (rediseño «Café sereno»): el composer es una superficie blanca
 * con borde y radio 14px, el typeahead fantasma va en text-muted, los botones
 * de mic (con borde) y enviar (azul) son circulares, y bajo el composer vive
 * la línea mono PERSISTENTE «TAB acepta la sugerencia · ENTER envía · La
 * conversación es solo en inglés» (ya no condicional al fantasma).
 *
 * Los hooks de IA/voz y el contexto de Emma se mockean: aquí solo se fija la
 * presentación; sus contratos no cambian (FR-022).
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

vi.mock("@/interface/emma-context", () => ({ useEmma: () => ({ runtime: {} }) }));
vi.mock("@/components/chat/use-typeahead", () => ({
  useTypeahead: () => ({ ghost: " a small slice to try?", clearGhost: () => {} }),
}));
vi.mock("@/components/chat/use-suggestions", () => ({ useSuggestions: () => [] }));
vi.mock("@/components/chat/use-voice-input", () => ({
  useVoiceInput: () => ({ recording: false, busy: false, toggle: () => {} }),
}));

import { Composer } from "@/components/chat/composer";

function render(): string {
  return renderToStaticMarkup(
    createElement(Composer, {
      onSend: () => {},
      busy: false,
      context: "What can I get you?",
      sceneContext: "",
      level: "B1",
      scenarioType: "cafe",
    }),
  );
}

const LINEA = "TAB acepta la sugerencia · ENTER envía · La conversación es solo en inglés";

describe("Composer (rediseño Café sereno)", () => {
  it("el contenedor es superficie blanca con borde y radio 14px (FR-022)", () => {
    const html = render();
    expect(html).toContain("rounded-[14px]");
    expect(html).toMatch(/rounded-\[14px\][^"]*bg-card|bg-card[^"]*rounded-\[14px\]/);
  });

  it("el fantasma del typeahead usa text-muted (FR-022)", () => {
    expect(render()).toMatch(/text-muted[" ]/);
  });

  it("mic y enviar son circulares: mic con borde, enviar azul (FR-022)", () => {
    const html = render();
    const botones = html.match(/<button\b[^>]*>/g) ?? [];
    const mic = botones.find((b) => b.includes("nota de voz")) ?? "";
    const enviar = botones.find((b) => b.includes('aria-label="Enviar"')) ?? "";
    expect(mic).toContain("rounded-full");
    expect(mic).toContain("border");
    expect(enviar).toContain("rounded-full");
    expect(enviar).toContain("bg-primary");
  });

  it("la línea de ayuda mono es persistente y reemplaza el hint condicional (FR-021)", () => {
    const html = render();
    expect(html).toContain("TAB acepta la sugerencia");
    expect(html).toContain("ENTER envía");
    expect(html).toContain("La conversación es solo en inglés");
    expect(html).toMatch(/font-code[^"]*"[^>]*>TAB|<p[^>]*font-code/);
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/components/chat/composer.tsx"),
      "utf8",
    );
    expect(src).not.toContain("Pulsa Tab para aceptar la sugerencia");
    // La línea no depende del fantasma: vive fuera de todo condicional `ghost &&`.
    expect(src).toContain(LINEA);
    expect(src).not.toMatch(/ghost\s*&&[^\n]*TAB acepta/);
  });

  it("los contratos de useTypeahead/useSuggestions/useVoiceInput siguen intactos (FR-022)", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/components/chat/composer.tsx"),
      "utf8",
    );
    expect(src).toContain("useTypeahead(runtime!, context, text, busy, level)");
    expect(src).toContain("useSuggestions({");
    expect(src).toContain("useVoiceInput((t, audioUrl) => onSend(t, audioUrl))");
  });
});
