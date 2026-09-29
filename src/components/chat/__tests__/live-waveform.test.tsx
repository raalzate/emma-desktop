/**
 * H7 — LiveWaveform: barras que siguen el nivel de voz durante la grabación.
 * Render estático: dobla `useAudioLevels` para controlar las alturas sin
 * AudioContext real (no hay jsdom en este arnés de pruebas).
 */
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/chat/use-audio-levels", () => ({
  useAudioLevels: (stream: unknown, bars: number) =>
    stream ? [0, 0.5, 1].slice(0, bars) : new Array(bars).fill(0.12),
}));

const { LiveWaveform } = await import("@/components/chat/live-waveform");

describe("LiveWaveform", () => {
  it("pinta una barra por nivel devuelto por el hook", () => {
    const html = renderToStaticMarkup(
      createElement(LiveWaveform, { stream: {} as MediaStream, bars: 3 }),
    );
    expect((html.match(/<span/g) ?? []).length).toBe(3);
  });

  it("la altura de cada barra refleja el nivel (0 → mínima, 1 → máxima)", () => {
    const html = renderToStaticMarkup(
      createElement(LiveWaveform, { stream: {} as MediaStream, bars: 3 }),
    );
    const heights = [...html.matchAll(/height:(\d+)%/g)].map((m) => Number(m[1]));
    expect(heights[0]).toBeLessThan(heights[1]);
    expect(heights[1]).toBeLessThan(heights[2]);
  });

  it("sin stream, las barras quedan planas/estáticas (mismo nivel en reposo)", () => {
    const html = renderToStaticMarkup(
      createElement(LiveWaveform, { stream: null, bars: 4 }),
    );
    const heights = [...html.matchAll(/height:(\d+)%/g)].map((m) => Number(m[1]));
    expect(new Set(heights).size).toBe(1);
  });
});
