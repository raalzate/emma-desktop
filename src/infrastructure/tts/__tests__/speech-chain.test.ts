import { describe, it, expect, vi } from "vitest";
import { synthesizeChain, type ChainDeps, type EngineSpeech } from "../speech-chain";
import type { KokoroState } from "../kokoro-tts";

const speech = (tag: string): EngineSpeech => ({ audioUrl: `url:${tag}`, timings: [] });

/** Cadena con fakes: Kokoro disponible; el sleep nunca vence salvo que se pida. */
function build(over: {
  kokoro?: Partial<ChainDeps["kokoro"]>;
  sleep?: ChainDeps["sleep"];
  state?: KokoroState;
} = {}) {
  let state: KokoroState = over.state ?? "ready";
  const deps: ChainDeps = {
    kokoro: {
      available: () => true,
      state: () => state,
      warm: vi.fn(async () => void (state = "ready")),
      synthesize: vi.fn(async () => speech("kokoro")),
      ...over.kokoro,
    },
    budgetMs: 3000,
    sleep: over.sleep ?? (() => new Promise<void>(() => {})),
  };
  return deps;
}

describe("synthesizeChain", () => {
  it("marca engine kokoro cuando responde Kokoro", async () => {
    expect((await synthesizeChain(build())).engine).toBe("kokoro");
  });

  it("si Kokoro tampoco está disponible rechaza para que el llamador use Web Speech", async () => {
    const deps = build({ kokoro: { available: () => false } });
    await expect(synthesizeChain(deps)).rejects.toThrow();
  });

  it("si Kokoro falla al sintetizar rechaza (Web Speech)", async () => {
    const deps = build({ kokoro: { synthesize: vi.fn(async () => { throw new Error("oom"); }) } });
    await expect(synthesizeChain(deps)).rejects.toThrow("oom");
  });

  it("con el modelo sin cargar espera la carga dentro del presupuesto y luego sintetiza", async () => {
    const deps = build({ state: "idle" });
    expect((await synthesizeChain(deps)).audioUrl).toBe("url:kokoro");
    expect(deps.kokoro.warm).toHaveBeenCalledTimes(1);
  });

  it("si el modelo no está listo en el presupuesto rechaza, pero la descarga sigue en segundo plano", async () => {
    let terminarDescarga!: () => void;
    const warm = vi.fn(() => new Promise<void>((r) => (terminarDescarga = r)));
    const deps = build({
      state: "idle",
      kokoro: { warm },
      sleep: async () => {}, // el presupuesto vence de inmediato
    });
    await expect(synthesizeChain(deps)).rejects.toThrow(/budget|presupuesto/i);
    expect(warm).toHaveBeenCalledTimes(1);
    expect(deps.kokoro.synthesize).not.toHaveBeenCalled();
    terminarDescarga(); // la descarga termina después sin romper nada
  });

  it("si la carga del modelo falla dentro del presupuesto rechaza", async () => {
    const deps = build({
      state: "idle",
      kokoro: { warm: vi.fn(async () => { throw new Error("sin red"); }) },
    });
    await expect(synthesizeChain(deps)).rejects.toThrow("sin red");
  });

  it("con el modelo ya listo no aplica presupuesto a la generación", async () => {
    const sleep = vi.fn(async () => {});
    const deps = build({ state: "ready", sleep });
    expect((await synthesizeChain(deps)).audioUrl).toBe("url:kokoro");
    expect(sleep).not.toHaveBeenCalled();
  });
});
