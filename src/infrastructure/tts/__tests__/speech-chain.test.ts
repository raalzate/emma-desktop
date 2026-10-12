import { describe, it, expect, vi } from "vitest";
import { createEdgeBreaker, synthesizeChain, type ChainDeps, type EngineSpeech } from "../speech-chain";
import type { KokoroState } from "../kokoro-tts";

const speech = (tag: string): EngineSpeech => ({ audioUrl: `url:${tag}`, timings: [] });

/** Cadena con fakes: Edge y Kokoro disponibles; el sleep nunca vence salvo que se pida. */
function build(over: {
  edge?: Partial<ChainDeps["edge"]>;
  kokoro?: Partial<ChainDeps["kokoro"]>;
  sleep?: ChainDeps["sleep"];
  state?: KokoroState;
} = {}) {
  let state: KokoroState = over.state ?? "ready";
  const deps: ChainDeps = {
    edge: { available: () => true, synthesize: vi.fn(async () => speech("edge")), ...over.edge },
    kokoro: {
      available: () => true,
      state: () => state,
      warm: vi.fn(async () => void (state = "ready")),
      synthesize: vi.fn(async () => speech("kokoro")),
      ...over.kokoro,
    },
    breaker: createEdgeBreaker(),
    budgetMs: 3000,
    sleep: over.sleep ?? (() => new Promise<void>(() => {})),
  };
  return deps;
}

describe("createEdgeBreaker", () => {
  it("arranca cerrado, se abre con trip y no se cierra solo", () => {
    const b = createEdgeBreaker();
    expect(b.tripped()).toBe(false);
    b.trip();
    expect(b.tripped()).toBe(true);
  });
});

describe("synthesizeChain", () => {
  it("marca engine edge cuando responde Edge", async () => {
    expect((await synthesizeChain(build())).engine).toBe("edge");
  });

  it("marca engine kokoro cuando Edge no está disponible", async () => {
    const deps = build({ edge: { available: () => false } });
    expect((await synthesizeChain(deps)).engine).toBe("kokoro");
  });

  it("marca engine kokoro cuando Edge falla", async () => {
    const deps = build({ edge: { synthesize: vi.fn(async () => { throw new Error("403"); }) } });
    expect((await synthesizeChain(deps)).engine).toBe("kokoro");
  });

  it("usa Edge primero cuando responde", async () => {
    const deps = build();
    expect((await synthesizeChain(deps)).audioUrl).toBe("url:edge");
    expect(deps.kokoro.synthesize).not.toHaveBeenCalled();
  });

  it("si Edge falla cae a Kokoro y abre el breaker", async () => {
    const deps = build({ edge: { synthesize: vi.fn(async () => { throw new Error("403"); }) } });
    expect((await synthesizeChain(deps)).audioUrl).toBe("url:kokoro");
    expect(deps.breaker.tripped()).toBe(true);
  });

  it("con el breaker abierto no reintenta Edge", async () => {
    const deps = build({ edge: { synthesize: vi.fn(async () => { throw new Error("403"); }) } });
    await synthesizeChain(deps);
    await synthesizeChain(deps);
    await synthesizeChain(deps);
    expect(deps.edge.synthesize).toHaveBeenCalledTimes(1);
    expect(deps.kokoro.synthesize).toHaveBeenCalledTimes(3);
  });

  it("si Edge no está disponible va directo a Kokoro sin abrir el breaker", async () => {
    const deps = build({ edge: { available: () => false } });
    expect((await synthesizeChain(deps)).audioUrl).toBe("url:kokoro");
    expect(deps.edge.synthesize).not.toHaveBeenCalled();
    expect(deps.breaker.tripped()).toBe(false);
  });

  it("si Kokoro tampoco está disponible rechaza para que el llamador use Web Speech", async () => {
    const deps = build({ edge: { available: () => false }, kokoro: { available: () => false } });
    await expect(synthesizeChain(deps)).rejects.toThrow();
  });

  it("si Kokoro falla al sintetizar rechaza (Web Speech)", async () => {
    const deps = build({ edge: { available: () => false }, kokoro: { synthesize: vi.fn(async () => { throw new Error("oom"); }) } });
    await expect(synthesizeChain(deps)).rejects.toThrow("oom");
  });

  it("con el modelo sin cargar espera la carga dentro del presupuesto y luego sintetiza", async () => {
    const deps = build({ edge: { available: () => false }, state: "idle" });
    expect((await synthesizeChain(deps)).audioUrl).toBe("url:kokoro");
    expect(deps.kokoro.warm).toHaveBeenCalledTimes(1);
  });

  it("si el modelo no está listo en el presupuesto rechaza, pero la descarga sigue en segundo plano", async () => {
    let terminarDescarga!: () => void;
    const warm = vi.fn(() => new Promise<void>((r) => (terminarDescarga = r)));
    const deps = build({
      edge: { available: () => false },
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
      edge: { available: () => false },
      state: "idle",
      kokoro: { warm: vi.fn(async () => { throw new Error("sin red"); }) },
    });
    await expect(synthesizeChain(deps)).rejects.toThrow("sin red");
  });

  it("con el modelo ya listo no aplica presupuesto a la generación", async () => {
    const sleep = vi.fn(async () => {});
    const deps = build({ edge: { available: () => false }, state: "ready", sleep });
    expect((await synthesizeChain(deps)).audioUrl).toBe("url:kokoro");
    expect(sleep).not.toHaveBeenCalled();
  });
});
