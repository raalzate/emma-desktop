/**
 * Coherencia del hint (FR-021, enmienda): la línea mono sigue siendo
 * PERSISTENTE — el recordatorio de inmersión y ENTER valen en todo momento —
 * pero el segmento «TAB acepta la sugerencia» solo aparece cuando hay un
 * fantasma que aceptar. Anunciar un atajo que no hace nada fue justo lo que
 * dejó al aprendiz sin saber qué era TAB.
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const fantasma = { valor: "" };

vi.mock("@/interface/emma-context", () => ({ useEmma: () => ({ runtime: {} }) }));
vi.mock("@/components/chat/use-typeahead", () => ({
  useTypeahead: () => ({ ghost: fantasma.valor, clearGhost: () => {} }),
}));
vi.mock("@/components/chat/use-suggestions", () => ({ useSuggestions: () => [] }));
vi.mock("@/components/chat/use-voice-input", () => ({
  useVoiceInput: () => ({ recording: false, busy: false, toggle: () => {} }),
}));

import { Composer } from "@/components/chat/composer";

function render(ghost: string): string {
  fantasma.valor = ghost;
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

describe("Composer — hint coherente con el fantasma", () => {
  it("sin fantasma NO anuncia el atajo TAB", () => {
    const html = render("");
    expect(html).not.toContain("TAB acepta");
    // La línea persiste: ENTER e inmersión no dependen del fantasma.
    expect(html).toContain("ENTER envía");
    expect(html).toContain("La conversación es solo en inglés");
  });

  it("con fantasma anuncia TAB delante del resto de la línea", () => {
    const html = render(" a small slice to try?");
    expect(html).toContain("TAB acepta la sugerencia");
    expect(html).toContain("ENTER envía");
    expect(html.indexOf("TAB acepta")).toBeLessThan(html.indexOf("ENTER envía"));
  });
});
