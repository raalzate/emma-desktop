import { describe, it, expect, vi } from "vitest";
import { createNativeEngineLoader, preferFirstLoader } from "../native-engine";
import type { KokoroEngine } from "../kokoro-tts";

const wav = new Uint8Array([82, 73, 70, 70]);

describe("createNativeEngineLoader", () => {
  it("precalienta el motor nativo y devuelve audio WAV con su duración", async () => {
    const api = { ttsNativeWarm: vi.fn(async () => {}), ttsNativeGenerate: vi.fn(async () => ({ wav, duration: 1.5 })) };
    const engine = await createNativeEngineLoader(() => api)();
    expect(api.ttsNativeWarm).toHaveBeenCalled();
    const audio = await engine.generate("Hi.", { voice: "af_heart" });
    expect(api.ttsNativeGenerate).toHaveBeenCalledWith("Hi.", "af_heart");
    expect(audio.duration).toBe(1.5);
    expect(audio.toBlob().type).toBe("audio/wav");
  });

  it("sin puente nativo (navegador, preload viejo) rechaza para caer al Worker", async () => {
    await expect(createNativeEngineLoader(() => undefined)()).rejects.toThrow();
    await expect(createNativeEngineLoader(() => ({}))()).rejects.toThrow();
  });
});

describe("preferFirstLoader", () => {
  const engine = (name: string): KokoroEngine => ({
    generate: async () => ({ duration: 1, toBlob: () => new Blob([name]) }),
  });

  it("usa el primero si carga", async () => {
    const second = vi.fn(async () => engine("wasm"));
    const loaded = await preferFirstLoader(async () => engine("native"), second)();
    expect(await (await loaded.generate("x", { voice: "af_heart" })).toBlob().text()).toBe("native");
    expect(second).not.toHaveBeenCalled();
  });

  it("si el primero falla, carga el segundo", async () => {
    const loaded = await preferFirstLoader(async () => { throw new Error("sin binario"); }, async () => engine("wasm"))();
    expect(await (await loaded.generate("x", { voice: "af_heart" })).toBlob().text()).toBe("wasm");
  });
});
