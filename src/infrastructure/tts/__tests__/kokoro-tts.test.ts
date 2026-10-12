import { describe, it, expect, vi } from "vitest";
import { createKokoroService, pickDevice, type KokoroEngine, type KokoroAudio } from "../kokoro-tts";

function fakeAudio(seconds: number, rate = 24000): KokoroAudio {
  return { audio: new Float32Array(Math.round(seconds * rate)), sampling_rate: rate, toBlob: () => new Blob(["wav"]) };
}

function service(over: { engine?: KokoroEngine; load?: () => Promise<KokoroEngine> } = {}) {
  const engine: KokoroEngine = over.engine ?? { generate: vi.fn(async () => fakeAudio(2)) };
  const load = over.load ?? vi.fn(async () => engine);
  const svc = createKokoroService({ load, toUrl: () => "blob:fake" });
  return { svc, engine, load };
}

describe("pickDevice", () => {
  it("usa webgpu si el navegador lo expone y wasm si no", () => {
    expect(pickDevice({ gpu: {} })).toBe("webgpu");
    expect(pickDevice({})).toBe("wasm");
    expect(pickDevice(undefined)).toBe("wasm");
  });
});

describe("createKokoroService", () => {
  it("sintetiza y devuelve la URL del audio con timings que cubren la duración", async () => {
    const { svc } = service();
    const r = await svc.synthesize("Hello there. Nice to meet you.", "af_heart");
    expect(r.audioUrl).toBe("blob:fake");
    expect(r.timings.map((t) => t.word)).toEqual(["Hello", "there.", "Nice", "to", "meet", "you."]);
    expect(r.timings[r.timings.length - 1].end).toBeCloseTo(2, 6);
  });

  it("pasa la voz al motor", async () => {
    const generate = vi.fn(async () => fakeAudio(1));
    const { svc } = service({ engine: { generate } });
    await svc.synthesize("hi", "bf_emma");
    expect(generate).toHaveBeenCalledWith("hi", { voice: "bf_emma" });
  });

  it("carga el modelo una sola vez aunque se sintetice varias veces o en paralelo", async () => {
    const { svc, load } = service();
    await Promise.all([svc.synthesize("a", "af_heart"), svc.synthesize("b", "af_heart")]);
    await svc.synthesize("c", "af_heart");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("reporta el estado: idle, loading, ready", async () => {
    let release!: (e: KokoroEngine) => void;
    const load = () => new Promise<KokoroEngine>((r) => (release = r));
    const { svc } = service({ load });
    expect(svc.state()).toBe("idle");
    const warm = svc.warm();
    expect(svc.state()).toBe("loading");
    release({ generate: async () => fakeAudio(1) });
    await warm;
    expect(svc.state()).toBe("ready");
  });

  it("si la carga falla, rechaza, vuelve a idle y el siguiente intento recarga", async () => {
    const engine: KokoroEngine = { generate: async () => fakeAudio(1) };
    const load = vi.fn().mockRejectedValueOnce(new Error("sin red")).mockResolvedValue(engine);
    const { svc } = service({ load });
    await expect(svc.synthesize("hi", "af_heart")).rejects.toThrow("sin red");
    expect(svc.state()).toBe("idle");
    await expect(svc.synthesize("hi", "af_heart")).resolves.toBeDefined();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("sintetiza de a una: no solapa generaciones", async () => {
    let activas = 0;
    let maxActivas = 0;
    const generate = vi.fn(async () => {
      activas++;
      maxActivas = Math.max(maxActivas, activas);
      await new Promise((r) => setTimeout(r, 5));
      activas--;
      return fakeAudio(1);
    });
    const { svc } = service({ engine: { generate } });
    await Promise.all([svc.synthesize("a", "af_heart"), svc.synthesize("b", "af_heart"), svc.synthesize("c", "af_heart")]);
    expect(maxActivas).toBe(1);
  });

  it("una generación fallida no bloquea las siguientes", async () => {
    const generate = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue(fakeAudio(1));
    const { svc } = service({ engine: { generate } });
    await expect(svc.synthesize("a", "af_heart")).rejects.toThrow("boom");
    await expect(svc.synthesize("b", "af_heart")).resolves.toBeDefined();
  });
});
