/**
 * En el onboarding Emma habla sola: cada mensaje suyo se locuta en segundo
 * plano sin botón de play. Un mensaje nuevo corta al anterior, la voz neuronal cae
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
  return {
    paused: false,
    onended: null,
    play: vi.fn(async () => {}),
    pause: vi.fn(function (this: { paused: boolean }) { this.paused = true; }),
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function deps(over: Partial<BackgroundVoiceDeps> = {}) {
  const audios: ReturnType<typeof fakeAudio>[] = [];
  const d: BackgroundVoiceDeps = {
    neuralAvailable: () => true,
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
  it("locuta el mensaje con la voz neuronal sin que nadie pulse play", async () => {
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

  it("si la voz neuronal falla cae a la voz local del sistema", async () => {
    const { d } = deps({ synthesize: vi.fn(async () => { throw new Error("sin red"); }) });
    const voice = createBackgroundVoice(d);
    await voice.speak("Hello");
    expect(d.speakLocal).toHaveBeenCalledWith("Hello", expect.any(Function));
  });

  it("sin voz neuronal usa Web Speech directamente", async () => {
    const { d } = deps({ neuralAvailable: () => false });
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

  // Kokoro en WASM sintetiza ~3x más lento que el tiempo real (#267): esperar el
  // mensaje entero dejaba segundos de silencio. Se trocea por oración.
  const LONG = "Hi there, I am Emma. I will be your English tutor. Tell me about yourself.";

  it("trocea por oración: suena la primera mientras se sintetiza el resto", async () => {
    const { d, audios } = deps();
    const voice = createBackgroundVoice(d);
    await voice.speak(LONG);
    expect(d.synthesize).toHaveBeenNthCalledWith(1, "Hi there, I am Emma.");
    expect(audios[0].play).toHaveBeenCalled();
    expect(audios).toHaveLength(1);
  });

  it("al terminar un trozo suena el siguiente, en orden", async () => {
    const { d, audios } = deps();
    const voice = createBackgroundVoice(d);
    await voice.speak(LONG);
    audios[0].onended?.(new Event("ended"));
    await flush();
    expect(d.createAudio).toHaveBeenNthCalledWith(2, "url:I will be your English tutor.");
    expect(audios[1].play).toHaveBeenCalled();
    audios[1].onended?.(new Event("ended"));
    await flush();
    expect(d.createAudio).toHaveBeenNthCalledWith(3, "url:Tell me about yourself.");
  });

  it("si falla un trozo posterior, lo que falta lo dice la voz local", async () => {
    const synthesize = vi.fn(async (text: string) => {
      if (text.startsWith("Hi")) return `url:${text}`;
      throw new Error("worker caído");
    });
    const { d, audios } = deps({ synthesize });
    const voice = createBackgroundVoice(d);
    await voice.speak(LONG);
    audios[0].onended?.(new Event("ended"));
    await flush();
    expect(d.speakLocal).toHaveBeenCalledWith("I will be your English tutor. Tell me about yourself.", expect.any(Function));
  });

  it("un mensaje nuevo corta los trozos pendientes del anterior", async () => {
    const { d, audios } = deps();
    const voice = createBackgroundVoice(d);
    await voice.speak(LONG);
    const first = audios[0];
    await voice.speak("Great, let's start now!");
    first.onended?.(new Event("ended"));
    await flush();
    expect(d.createAudio).not.toHaveBeenCalledWith("url:I will be your English tutor.");
  });

  // Sin indicio, la espera de la voz parecía un cuelgue (#269).
  it("informa el estado: preparing mientras sintetiza, speaking al sonar, idle al terminar", async () => {
    const states: string[] = [];
    const { d, audios } = deps({ onState: (s) => void states.push(s) });
    const voice = createBackgroundVoice(d);
    await voice.speak("Hi there, I am Emma.");
    expect(states).toEqual(["preparing", "speaking"]);
    audios[0].onended?.(new Event("ended"));
    await flush();
    expect(states.at(-1)).toBe("idle");
  });

  it("con la voz local también pasa a speaking y a idle cuando termina", async () => {
    const states: string[] = [];
    let end: () => void = () => {};
    const speakLocal = vi.fn((_t: string, onEnd: () => void) => ((end = onEnd), { stop: vi.fn() }));
    const { d } = deps({ neuralAvailable: () => false, speakLocal, onState: (s) => void states.push(s) });
    await createBackgroundVoice(d).speak("Hello");
    expect(states.at(-1)).toBe("speaking");
    end();
    expect(states.at(-1)).toBe("idle");
  });

  it("stop() deja el estado en idle", async () => {
    const states: string[] = [];
    const { d } = deps({ onState: (s) => void states.push(s) });
    const voice = createBackgroundVoice(d);
    await voice.speak("Hi there, I am Emma.");
    voice.stop();
    expect(states.at(-1)).toBe("idle");
  });

  it("stop() durante la síntesis (pantalla desmontada) no deja sonar nada después", async () => {
    let resolve: (url: string) => void = () => {};
    const { d, audios } = deps({ synthesize: vi.fn(() => new Promise<string>((r) => (resolve = r))) });
    const voice = createBackgroundVoice(d);
    const pending = voice.speak("Hello there, how are you?");
    voice.stop();
    resolve("url:late");
    await pending;
    expect(audios).toHaveLength(0);
  });

  it("stop() calla tanto el audio neuronal como la voz local", async () => {
    const localHandle = { stop: vi.fn() };
    const { d, audios } = deps({ neuralAvailable: () => false, speakLocal: vi.fn(() => localHandle) });
    const voice = createBackgroundVoice(d);
    await voice.speak("Hello");
    voice.stop();
    expect(localHandle.stop).toHaveBeenCalled();
    expect(audios).toHaveLength(0);
  });
});
