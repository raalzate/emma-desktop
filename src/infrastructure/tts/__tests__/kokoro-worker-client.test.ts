import { describe, it, expect } from "vitest";
import { createWorkerEngineLoader, type WorkerLike } from "../kokoro-worker-client";

class FakeWorker implements WorkerLike {
  posted: Array<Record<string, unknown>> = [];
  terminated = false;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage(message: unknown) {
    this.posted.push(message as Record<string, unknown>);
  }
  terminate() {
    this.terminated = true;
  }
  reply(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
  lastId() {
    return this.posted[this.posted.length - 1].id as number;
  }
}

function setup() {
  const workers: FakeWorker[] = [];
  const load = createWorkerEngineLoader(() => {
    const w = new FakeWorker();
    workers.push(w);
    return w;
  });
  return { load, workers };
}

async function ready(load: ReturnType<typeof setup>["load"], workers: FakeWorker[]) {
  const pending = load();
  workers[workers.length - 1].reply({ type: "ready", id: workers[workers.length - 1].lastId() });
  return pending;
}

describe("createWorkerEngineLoader", () => {
  it("pide la carga al worker y resuelve el motor cuando responde ready", async () => {
    const { load, workers } = setup();
    const pending = load();
    expect(workers[0].posted).toEqual([{ type: "load", id: 0 }]);
    workers[0].reply({ type: "ready", id: 0 });
    await expect(pending).resolves.toBeDefined();
  });

  it("si la carga responde error, rechaza y termina el worker", async () => {
    const { load, workers } = setup();
    const pending = load();
    workers[0].reply({ type: "error", id: 0, message: "sin red" });
    await expect(pending).rejects.toThrow("sin red");
    expect(workers[0].terminated).toBe(true);
  });

  it("generate manda texto y voz, y devuelve duración y blob del audio", async () => {
    const { load, workers } = setup();
    const engine = await ready(load, workers);
    const pending = engine.generate("hello", { voice: "bf_emma" });
    const w = workers[0];
    expect(w.posted[w.posted.length - 1]).toMatchObject({ type: "generate", text: "hello", voice: "bf_emma" });
    const blob = new Blob(["wav"]);
    w.reply({ type: "audio", id: w.lastId(), blob, duration: 1.5 });
    const audio = await pending;
    expect(audio.duration).toBe(1.5);
    expect(audio.toBlob()).toBe(blob);
  });

  it("correlaciona respuestas por id aunque lleguen desordenadas", async () => {
    const { load, workers } = setup();
    const engine = await ready(load, workers);
    const a = engine.generate("a", { voice: "af_heart" });
    const idA = workers[0].lastId();
    const b = engine.generate("b", { voice: "af_heart" });
    const idB = workers[0].lastId();
    workers[0].reply({ type: "audio", id: idB, blob: new Blob(["b"]), duration: 2 });
    workers[0].reply({ type: "audio", id: idA, blob: new Blob(["a"]), duration: 1 });
    expect((await a).duration).toBe(1);
    expect((await b).duration).toBe(2);
  });

  it("un error de generate rechaza solo esa petición", async () => {
    const { load, workers } = setup();
    const engine = await ready(load, workers);
    const pending = engine.generate("x", { voice: "af_heart" });
    workers[0].reply({ type: "error", id: workers[0].lastId(), message: "boom" });
    await expect(pending).rejects.toThrow("boom");
    expect(engine.isDead?.()).toBe(false);
  });

  it("ignora mensajes que no son del protocolo", async () => {
    const { load, workers } = setup();
    const engine = await ready(load, workers);
    const pending = engine.generate("x", { voice: "af_heart" });
    workers[0].reply({ type: "audio", id: workers[0].lastId(), blob: "no-es-blob", duration: 1 });
    workers[0].reply(42);
    workers[0].reply({ type: "audio", id: workers[0].lastId(), blob: new Blob([]), duration: 3 });
    expect((await pending).duration).toBe(3);
  });

  it("si el worker cae, rechaza lo pendiente, queda muerto y rechaza lo nuevo", async () => {
    const { load, workers } = setup();
    const engine = await ready(load, workers);
    const pending = engine.generate("x", { voice: "af_heart" });
    workers[0].onerror?.({ message: "out of memory" } as ErrorEvent);
    await expect(pending).rejects.toThrow(/worker/i);
    expect(engine.isDead?.()).toBe(true);
    expect(workers[0].terminated).toBe(true);
    await expect(engine.generate("y", { voice: "af_heart" })).rejects.toThrow(/worker/i);
  });

  it("si el worker cae durante la carga, la carga rechaza", async () => {
    const { load, workers } = setup();
    const pending = load();
    workers[0].onerror?.({ message: "no se pudo cargar el script" } as ErrorEvent);
    await expect(pending).rejects.toThrow(/worker/i);
  });
});
