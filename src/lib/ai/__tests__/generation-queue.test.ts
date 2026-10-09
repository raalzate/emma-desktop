import { describe, expect, it } from "vitest";
import { abortError, createGenerationQueue, isAbortError } from "../generation-queue";

/** Trabajo controlable: se resuelve a mano y respeta el signal que recibe. */
function trabajo(nombre: string, log: string[]) {
  let resolver: (v: string) => void = () => {};
  let signalRecibido: AbortSignal | undefined;
  const run = (signal: AbortSignal) =>
    new Promise<string>((resolve, reject) => {
      log.push(`inicio:${nombre}`);
      signalRecibido = signal;
      resolver = resolve;
      signal.addEventListener("abort", () => {
        log.push(`cancel:${nombre}`);
        reject(abortError());
      });
    });
  return { run, terminar: () => resolver(nombre), signal: () => signalRecibido };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("generation-queue — orden", () => {
  it("serializa: la segunda no arranca hasta que termina la primera", async () => {
    const log: string[] = [];
    const q = createGenerationQueue();
    const a = trabajo("a", log);
    const b = trabajo("b", log);
    const pa = q.enqueue({ priority: "interactive", run: a.run });
    const pb = q.enqueue({ priority: "interactive", run: b.run });
    await tick();
    expect(log).toEqual(["inicio:a"]);
    a.terminar();
    await pa;
    await tick();
    expect(log).toEqual(["inicio:a", "inicio:b"]);
    b.terminar();
    await pb;
  });

  it("la interactiva sale antes que cualquier background en espera", async () => {
    const log: string[] = [];
    const q = createGenerationQueue();
    const primero = trabajo("primero", log);
    const bg = trabajo("bg", log);
    const inter = trabajo("inter", log);
    const p1 = q.enqueue({ priority: "interactive", run: primero.run });
    const pbg = q.enqueue({ priority: "background", run: bg.run });
    const pin = q.enqueue({ priority: "interactive", run: inter.run });
    await tick();
    primero.terminar();
    await p1;
    await tick();
    expect(log).toEqual(["inicio:primero", "inicio:inter"]);
    inter.terminar();
    await pin;
    await tick();
    bg.terminar();
    await pbg;
    expect(log.at(-1)).toBe("inicio:bg");
  });

  it("respeta FIFO dentro de la misma prioridad", async () => {
    const log: string[] = [];
    const q = createGenerationQueue();
    const w = trabajo("w", log);
    const x = trabajo("x", log);
    const y = trabajo("y", log);
    const z = trabajo("z", log);
    const ps = [
      q.enqueue({ priority: "background", run: w.run }),
      q.enqueue({ priority: "background", run: x.run }),
      q.enqueue({ priority: "background", run: y.run }),
      q.enqueue({ priority: "background", run: z.run }),
    ];
    for (const t of [w, x, y, z]) {
      await tick();
      t.terminar();
    }
    await Promise.all(ps);
    expect(log).toEqual(["inicio:w", "inicio:x", "inicio:y", "inicio:z"]);
  });
});

describe("generation-queue — cancelación", () => {
  it("abortar una entrada en espera la saca de la cola y rechaza con AbortError", async () => {
    const log: string[] = [];
    const q = createGenerationQueue();
    const a = trabajo("a", log);
    const b = trabajo("b", log);
    const ctrl = new AbortController();
    const pa = q.enqueue({ priority: "interactive", run: a.run });
    const pb = q.enqueue({ priority: "interactive", run: b.run, signal: ctrl.signal });
    await tick();
    ctrl.abort();
    await expect(pb).rejects.toSatisfy(isAbortError);
    a.terminar();
    await pa;
    await tick();
    expect(log).toEqual(["inicio:a"]);
  });

  it("un signal ya abortado rechaza sin ejecutar", async () => {
    const log: string[] = [];
    const q = createGenerationQueue();
    const ctrl = new AbortController();
    ctrl.abort();
    const a = trabajo("a", log);
    await expect(q.enqueue({ priority: "interactive", run: a.run, signal: ctrl.signal })).rejects.toSatisfy(
      isAbortError,
    );
    expect(log).toEqual([]);
  });

  it("abortar la que corre aborta el signal del trabajo y libera la cola", async () => {
    const log: string[] = [];
    const q = createGenerationQueue();
    const ctrl = new AbortController();
    const a = trabajo("a", log);
    const b = trabajo("b", log);
    const pa = q.enqueue({ priority: "interactive", run: a.run, signal: ctrl.signal });
    const pb = q.enqueue({ priority: "interactive", run: b.run });
    await tick();
    ctrl.abort();
    await expect(pa).rejects.toSatisfy(isAbortError);
    await tick();
    expect(log).toEqual(["inicio:a", "cancel:a", "inicio:b"]);
    b.terminar();
    await pb;
  });

  it("una interactiva que llega mientras corre una background la preempta", async () => {
    const log: string[] = [];
    const q = createGenerationQueue();
    const bg = trabajo("bg", log);
    const inter = trabajo("inter", log);
    const pbg = q.enqueue({ priority: "background", run: bg.run });
    await tick();
    const pin = q.enqueue({ priority: "interactive", run: inter.run });
    await expect(pbg).rejects.toSatisfy(isAbortError);
    await tick();
    expect(log).toEqual(["inicio:bg", "cancel:bg", "inicio:inter"]);
    inter.terminar();
    await pin;
  });

  it("una background que llega mientras corre una interactiva NO preempta", async () => {
    const log: string[] = [];
    const q = createGenerationQueue();
    const inter = trabajo("inter", log);
    const bg = trabajo("bg", log);
    const pin = q.enqueue({ priority: "interactive", run: inter.run });
    const pbg = q.enqueue({ priority: "background", run: bg.run });
    await tick();
    expect(log).toEqual(["inicio:inter"]);
    inter.terminar();
    await pin;
    await tick();
    bg.terminar();
    await pbg;
  });

  it("un fallo del trabajo no bloquea la cola", async () => {
    const q = createGenerationQueue();
    const pa = q.enqueue({ priority: "interactive", run: async () => { throw new Error("boom"); } });
    const pb = q.enqueue({ priority: "interactive", run: async () => "ok" });
    await expect(pa).rejects.toThrow("boom");
    await expect(pb).resolves.toBe("ok");
  });
});
