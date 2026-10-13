import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PROTOPERSONAS } from "@/domain/personas/protopersona";
import { PersonaVoiceSampleView, engineLabel } from "@/components/settings/persona-voice-sample";

const persona = PROTOPERSONAS.daily_standup;
const base = { persona, engine: null, playing: false, loading: false, available: true, onToggle: () => {} } as const;
const render = (over: Partial<Parameters<typeof PersonaVoiceSampleView>[0]> = {}) =>
  renderToStaticMarkup(createElement(PersonaVoiceSampleView, { ...base, ...over }));

describe("engineLabel", () => {
  it("nombra cada motor en inglés, o nada antes de reproducir", () => {
    expect(engineLabel("kokoro")).toBe("Kokoro (on this device)");
    expect(engineLabel("system")).toBe("System voice");
    expect(engineLabel(null)).toBeNull();
  });
});

describe("PersonaVoiceSampleView", () => {
  it("muestra el badge con motor, voz Kokoro y acento", () => {
    expect(render()).toMatch(/Kokoro · [a-z]{2}_[a-z]+ · (US|British) English/);
  });

  it("ofrece «Play voice sample» con tooltip en español", () => {
    const html = render();
    expect(html).toContain("Play voice sample");
    expect(html).toMatch(/title="[^"]*(Escucha|escucha)[^"]*"/);
  });

  it("muestra «Stop» mientras suena", () => {
    const html = render({ playing: true });
    expect(html).toContain("Stop");
    expect(html).not.toContain("Play voice sample");
  });

  it("deshabilita el botón si no hay voz disponible", () => {
    expect(render({ available: false })).toContain("disabled");
  });

  it("no dice con qué sonó antes de reproducir y sí después", () => {
    expect(render()).not.toContain("Played with");
    expect(render({ engine: "kokoro" })).toContain("Played with: Kokoro (on this device)");
    expect(render({ engine: "system" })).toContain("Played with: System voice");
  });
});
