import { describe, expect, it } from "vitest";
import { AUDIO_NOTICE, shouldShowAudioNotice } from "../audio-privacy-notice";

describe("shouldShowAudioNotice", () => {
  it("se muestra la primera vez que se guarda audio", () => {
    expect(shouldShowAudioNotice({ noticeSeen: false })).toBe(true);
  });

  it("no se vuelve a mostrar una vez visto", () => {
    expect(shouldShowAudioNotice({ noticeSeen: true })).toBe(false);
  });

  it("sin preferencias guardadas cuenta como no visto", () => {
    expect(shouldShowAudioNotice(null)).toBe(true);
    expect(shouldShowAudioNotice({})).toBe(true);
  });
});

describe("AUDIO_NOTICE", () => {
  it("dice qué se guarda, dónde y cómo borrarlo (en inglés)", () => {
    const text = AUDIO_NOTICE.body.toLowerCase();
    expect(text).toContain("voice");
    expect(text).toContain("device");
    expect(text).toContain("settings");
  });
});
