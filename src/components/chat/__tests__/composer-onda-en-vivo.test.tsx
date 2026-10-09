/**
 * H7 — mientras el composer graba, muestra la onda en vivo (LiveWaveform) en
 * vez de solo el ícono estático del micrófono.
 */
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/interface/emma-context", () => ({ useEmma: () => ({ runtime: {} }) }));
vi.mock("@/components/chat/use-typeahead", () => ({
  useTypeahead: () => ({ ghost: "", clearGhost: () => {} }),
}));
vi.mock("@/components/chat/use-suggestions", () => ({ useSuggestions: () => [] }));
vi.mock("@/components/chat/use-audio-levels", () => ({
  useAudioLevels: (stream: unknown, bars: number) => new Array(bars).fill(stream ? 0.7 : 0.1),
}));

function render(recording: boolean): string {
  vi.doMock("@/components/chat/use-voice-input", () => ({
    useVoiceInput: () => ({
      recording,
      busy: false,
      available: true,
      stream: recording ? ({} as MediaStream) : null,
      toggle: () => {},
    }),
  }));
  return "";
}

// Import dinámico tras vi.resetModules: en frío y con la suite en paralelo pasa de 5 s.
describe("Composer — onda en vivo al grabar", { timeout: 20_000 }, () => {
  it("mientras graba, pinta la onda en vivo (LiveWaveform)", async () => {
    vi.resetModules();
    render(true);
    const { Composer } = await import("@/components/chat/composer");
    const html = renderToStaticMarkup(
      createElement(Composer, {
        onSend: () => {},
        busy: false,
        context: "Good morning!",
        sceneContext: "",
        level: "B1",
        scenarioType: "daily_standup",
      }),
    );
    expect(html).toContain("Recording…");
    expect((html.match(/<span/g) ?? []).length).toBeGreaterThan(0);
  });

  it("fuera de grabación, no muestra la onda en vivo", async () => {
    vi.resetModules();
    render(false);
    const { Composer } = await import("@/components/chat/composer");
    const html = renderToStaticMarkup(
      createElement(Composer, {
        onSend: () => {},
        busy: false,
        context: "Good morning!",
        sceneContext: "",
        level: "B1",
        scenarioType: "daily_standup",
      }),
    );
    expect(html).not.toContain("Recording…");
  });
});
