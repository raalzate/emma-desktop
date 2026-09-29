/**
 * En el onboarding Emma habla sola: cada mensaje suyo se locuta en segundo
 * plano sin botón de play. Un mensaje nuevo corta al anterior, la voz Edge cae
 * a Web Speech si falla, y una síntesis tardía de un mensaje viejo no pisa al
 * mensaje vigente.
 */

import { describe, expect, it, vi } from "vitest";
import {
  createBackgroundVoice,
  type BackgroundVoiceDeps,
  type Playable,
} from "@/components/onboarding/background-voice";

function fakeAudio(): Playable & { paused: boolean } {
  return { paused: false, play: vi.fn(async () => {}), pause: vi.fn(function (this: { paused: boolean }) { this.paused = true; }) };
}

function deps(over: Partial<BackgroundVoiceDeps> = {}) {
  const audios: ReturnType<typeof fakeAudio>[] = [];
  const d: BackgroundVoiceDeps = {
    edgeAvailable: () => true,
    synthesize: vi.fn(async (text: string) => `url:${text}`),
    createAudio: vi.fn(() => {
      const a = fakeAudio();
      audios.push(a);
      return a;
    }),
    localAvailable: () => true,
    speakLocal: vi.fn(() => ({ stop: vi.fn() })),
    ...over,
  };
  return { d, audios };
}

describe("Emma habla en background durante el onboarding", () => {
  it("locuta el mensaje con la voz Edge sin que nadie pulse play", async () => {
    const { d, audios } = deps();
    const voice = createBackgroundVoice(d);
    await voice.speak("Hi! What's your name?");
    expect(d.synthesize).toHaveBeenCalledWith("Hi! What's your name?");
    expect(audios[0].play).toHaveBeenCalled();
  });

  it("un mensaje nuevo detiene el audio del anterior", async () => {
    const { d, audios } = deps();
    const voice = createBackgroundVoice(d);
    await voice.speak("First");
    await voice.speak("Second");
    expect(audios[0].pause).toHaveBeenCalled();
    expect(audios[1].play).toHaveBeenCalled();
  });

  it("una síntesis tardía de un mensaje viejo no suena encima del vigente", async () => {
    let resolveFirst: (url: string) => void = () => {};
    const synthesize = vi.fn((text: string) =>
      text === "Slow"
        ? new Promise<string>((r) => (resolveFirst = r))
        : Promise.resolve(`url:${text}`),
    );
    const { d, audios } = deps({ synthesize });
    const voice = createBackgroundVoice(d);
    const slow = voice.speak("Slow");
    await voice.speak("Fast");
    resolveFirst("url:Slow");
    await slow;
    expect(audios).toHaveLength(1);
    expect(d.createAudio).toHaveBeenCalledWith("url:Fast");
  });

  it("si Edge falla cae a la voz local del sistema", async () => {
    const { d } = deps({ synthesize: vi.fn(async () => { throw new Error("sin red"); }) });
    const voice = createBackgroundVoice(d);
    await voice.speak("Hello");
    expect(d.speakLocal).toHaveBeenCalledWith("Hello", expect.any(Function));
  });

  it("sin Edge usa Web Speech directamente", async () => {
    const { d } = deps({ edgeAvailable: () => false });
    const voice = createBackgroundVoice(d);
    await voice.speak("Hello");
    expect(d.synthesize).not.toHaveBeenCalled();
    expect(d.speakLocal).toHaveBeenCalled();
  });

  it("al motor sólo va el texto hablable: sin emojis ni paréntesis", async () => {
    const { d } = deps();
    const voice = createBackgroundVoice(d);
    await voice.speak("Nice to meet you! 😊 (I'm Emma)");
    const spoken = (d.synthesize as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(spoken).not.toMatch(/😊|\(/);
    expect(spoken).toContain("Nice to meet you!");
  });

  it("un mensaje sin nada hablable no llama a ningún motor", async () => {
    const { d } = deps();
    const voice = createBackgroundVoice(d);
    await voice.speak("🎉🎉");
    expect(d.synthesize).not.toHaveBeenCalled();
    expect(d.speakLocal).not.toHaveBeenCalled();
  });

  it("stop() calla tanto el audio Edge como la voz local", async () => {
    const localHandle = { stop: vi.fn() };
    const { d, audios } = deps({ edgeAvailable: () => false, speakLocal: vi.fn(() => localHandle) });
    const voice = createBackgroundVoice(d);
    await voice.speak("Hello");
    voice.stop();
    expect(localHandle.stop).toHaveBeenCalled();
    expect(audios).toHaveLength(0);
  });
});
