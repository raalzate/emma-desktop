/** FR-023 — aviso de privacidad del audio: cuándo aparece y cómo se recuerda que se vio. */

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AUDIO_NOTICE } from "@/domain/audio/audio-privacy-notice";
import { createAudioNoticeGate } from "../audio-notice-gate";
import { AudioPrivacyNoticeView } from "../audio-privacy-notice";

function armar(noticeSeen: boolean, loadFails = false) {
  let prefs = { capBytes: 100_000_000, noticeSeen };
  const guardados: Array<typeof prefs> = [];
  const gate = createAudioNoticeGate({
    getPrefs: async () => {
      if (loadFails) throw new Error("store");
      return prefs;
    },
    savePrefs: async (p) => {
      prefs = p;
      guardados.push(p);
    },
  });
  const vistas: boolean[] = [];
  gate.subscribe((v) => vistas.push(v));
  return { gate, guardados, vistas };
}

describe("createAudioNoticeGate", () => {
  it("al primer clip guardado muestra el aviso", async () => {
    const { gate, vistas } = armar(false);
    await gate.clipSaved();
    expect(gate.visible()).toBe(true);
    expect(vistas).toEqual([true]);
  });

  it("si ya se vio, no vuelve a aparecer", async () => {
    const { gate } = armar(true);
    await gate.clipSaved();
    expect(gate.visible()).toBe(false);
  });

  it("varios clips seguidos no lo reabren ni lo duplican", async () => {
    const { gate, vistas } = armar(false);
    await gate.clipSaved();
    await gate.clipSaved();
    expect(vistas).toEqual([true]);
  });

  it("al cerrarlo persiste el visto sin tocar el tope", async () => {
    const { gate, guardados } = armar(false);
    await gate.clipSaved();
    await gate.dismiss();
    expect(gate.visible()).toBe(false);
    expect(guardados).toEqual([{ capBytes: 100_000_000, noticeSeen: true }]);
    await gate.clipSaved();
    expect(gate.visible()).toBe(false);
  });

  it("si no se pueden leer las preferencias, no muestra nada ni rompe", async () => {
    const { gate } = armar(false, true);
    await gate.clipSaved();
    expect(gate.visible()).toBe(false);
  });
});

describe("AudioPrivacyNoticeView", () => {
  it("pinta el aviso en inglés con un botón con tooltip en español", () => {
    const html = renderToStaticMarkup(createElement(AudioPrivacyNoticeView, { onDismiss: () => {} }));
    expect(html).toContain(AUDIO_NOTICE.title);
    expect(html).toContain(AUDIO_NOTICE.body);
    expect(html).toMatch(/<button[^>]*title="[^"]+"/);
    expect(html).toContain("Got it");
  });
});
