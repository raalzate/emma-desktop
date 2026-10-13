import { describe, it, expect, vi } from "vitest";
import { createKokoroWorkerHandler, type WorkerEngine } from "../kokoro-worker-core";
import type { WorkerResponse } from "../kokoro-protocol";

function setup(over: { load?: () => Promise<WorkerEngine> } = {}) {
  const blob = new Blob(["wav"]);
  const engine: WorkerEngine = { generate: vi.fn(async () => ({ blob, duration: 2 })) };
  const load = over.load ?? vi.fn(async () => engine);
  const sent: WorkerResponse[] = [];
  const handle = createKokoroWorkerHandler({ load, post: (m) => sent.push(m) });
  return { handle, sent, load, engine, blob };
}

describe("createKokoroWorkerHandler", () => {
  it("load responde ready con el mismo id", async () => {
    const { handle, sent } = setup();
    await handle({ type: "load", id: 7 });
    expect(sent).toEqual([{ type: "ready", id: 7 }]);
  });

  it("generate responde el audio con la voz y el texto pedidos", async () => {
    const { handle, sent, engine, blob } = setup();
    await handle({ type: "generate", id: 3, text: "hello", voice: "bf_emma" });
    expect(engine.generate).toHaveBeenCalledWith("hello", "bf_emma");
    expect(sent).toEqual([{ type: "audio", id: 3, blob, duration: 2 }]);
  });

  it("carga el modelo una sola vez entre load y varios generate", async () => {
    const { handle, load } = setup();
    await handle({ type: "load", id: 1 });
    await handle({ type: "generate", id: 2, text: "a", voice: "af_heart" });
    await handle({ type: "generate", id: 3, text: "b", voice: "af_heart" });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("si la carga falla responde error y el siguiente intento recarga", async () => {
    const engine: WorkerEngine = { generate: async () => ({ blob: new Blob([]), duration: 1 }) };
    const load = vi.fn().mockRejectedValueOnce(new Error("sin red")).mockResolvedValue(engine);
    const { handle, sent } = setup({ load });
    await handle({ type: "load", id: 1 });
    await handle({ type: "load", id: 2 });
    expect(sent[0]).toEqual({ type: "error", id: 1, message: "sin red" });
    expect(sent[1]).toEqual({ type: "ready", id: 2 });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("si generate falla responde error con el id y no tira", async () => {
    const engine: WorkerEngine = { generate: async () => { throw new Error("boom"); } };
    const { handle, sent } = setup({ load: async () => engine });
    await expect(handle({ type: "generate", id: 5, text: "x", voice: "af_heart" })).resolves.toBeUndefined();
    expect(sent).toEqual([{ type: "error", id: 5, message: "boom" }]);
  });

  it("descarta mensajes fuera del protocolo sin responder", async () => {
    const { handle, sent, load } = setup();
    await handle({ type: "nuke" });
    await handle(null);
    expect(sent).toEqual([]);
    expect(load).not.toHaveBeenCalled();
  });
});
