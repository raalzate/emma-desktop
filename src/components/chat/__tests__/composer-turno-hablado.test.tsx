/**
 * #169 — en un turno hablado el textarea queda deshabilitado, el placeholder
 * dice en español por qué, y la salida de emergencia está a la vista. Render
 * estático: los hooks de IA y de micrófono se doblan, que aquí no se prueban.
 */

import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { requiresVoice } from "@/domain/chat/voice-requirement";

vi.mock("@/interface/emma-context", () => ({ useEmma: () => ({ runtime: {} }) }));
vi.mock("@/components/chat/use-typeahead", () => ({
  useTypeahead: () => ({ ghost: "", clearGhost: () => {} }),
}));
vi.mock("@/components/chat/use-suggestions", () => ({ useSuggestions: () => [] }));
vi.mock("@/components/chat/use-voice-input", () => ({
  useVoiceInput: () => ({ recording: false, busy: false, available: true, toggle: () => {} }),
}));

const { Composer } = await import("@/components/chat/composer");

const saludo = requiresVoice({
  turn: 1,
  maxTurns: 12,
  lastVoiceTurn: null,
  expectsElaboration: false,
});

function render(over: Partial<Parameters<typeof Composer>[0]> = {}): string {
  return renderToStaticMarkup(
    createElement(Composer, {
      onSend: () => {},
      busy: false,
      context: "Good morning!",
      sceneContext: "",
      level: "B1",
      scenarioType: "daily_standup",
      ...over,
    }),
  );
}

describe("Composer en un turno hablado", () => {
  const html = render({ voiceRequirement: saludo, onVoiceUnavailable: () => {} });

  it("deshabilita el textarea y explica en español por qué", () => {
    expect(html).toContain("disabled");
    expect(html).toContain("saluda con tu voz");
    expect(html).not.toContain("Escribe tu respuesta en inglés…");
  });

  it("ofrece la salida de emergencia, que rehabilita el texto", () => {
    expect(html).toContain("No puedo hablar ahora");
  });

  it("la línea de atajos deja de prometer ENTER", () => {
    expect(html).toContain("Este turno se habla");
  });
});

describe("Composer en un turno normal", () => {
  const html = render({ voiceRequirement: null });

  it("no cambia el comportamiento de siempre: texto y voz disponibles", () => {
    expect(html).toContain("Escribe tu respuesta en inglés…");
    expect(html).not.toContain("No puedo hablar ahora");
    expect(html).toContain("ENTER envía");
  });
});
