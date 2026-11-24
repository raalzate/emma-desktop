import { describe, expect, it } from "vitest";
import type { AudioClip } from "@/domain/audio/audio-clip";
import type { EmmaApi } from "@/types/emma-api";
import { createIpcAudioStore } from "../ipc-audio-store";

type Bridge = Pick<
  EmmaApi,
  "audioSave" | "audioRead" | "audioRemove" | "audioRemoveConversation" | "audioRemoveAll" | "audioList" | "audioUsage"
>;

const meta = (id = "a1") => ({
  id,
  origin: "learner" as const,
  text: "hello",
  durationMs: 1000,
  bytes: 4,
  createdAt: 1,
});
const clip = (id = "a1"): AudioClip => ({ meta: meta(id), data: new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]) });

function fakeBridge(over: Partial<Record<keyof Bridge, unknown>> = {}): Bridge {
  const base = {
    audioSave: async () => ({ ok: true }),
    audioRead: async () => null,
    audioRemove: async () => ({ removed: 0 }),
    audioRemoveConversation: async () => ({ removed: 0 }),
    audioRemoveAll: async () => ({ ok: true }),
    audioList: async () => [],
    audioUsage: async () => ({ count: 0, bytes: 0 }),
  };
  return { ...base, ...over } as unknown as Bridge;
}

describe("createIpcAudioStore", () => {
  it("save envía meta, mime y bytes al puente", async () => {
    const calls: unknown[] = [];
    const store = createIpcAudioStore(() =>
      fakeBridge({ audioSave: async (a: unknown) => (calls.push(a), { ok: true }) }),
    );
    await store.save(clip());
    expect(calls).toEqual([{ meta: meta(), mime: "audio/webm;codecs=opus", data: clip().data }]);
  });

  it("save lanza si el main rechaza (invalid o io)", async () => {
    const store = createIpcAudioStore(() => fakeBridge({ audioSave: async () => ({ ok: false, error: "io" }) }));
    await expect(store.save(clip())).rejects.toThrow(/io/);
  });

  it("save lanza si no hay puente (fuera de Electron)", async () => {
    await expect(createIpcAudioStore(() => undefined).save(clip())).rejects.toThrow();
  });

  it("load devuelve el clip válido", async () => {
    const store = createIpcAudioStore(() => fakeBridge({ audioRead: async () => clip() }));
    expect(await store.load("a1")).toEqual(clip());
  });

  it("load devuelve null si no existe, la respuesta es inválida o no hay puente", async () => {
    expect(await createIpcAudioStore(() => fakeBridge()).load("a1")).toBeNull();
    const malo = createIpcAudioStore(() => fakeBridge({ audioRead: async () => ({ meta: { id: 1 }, data: "x" }) }));
    expect(await malo.load("a1")).toBeNull();
    expect(await createIpcAudioStore(() => undefined).load("a1")).toBeNull();
  });

  it("remove con lista vacía no llama al puente", async () => {
    let called = false;
    const store = createIpcAudioStore(() =>
      fakeBridge({ audioRemove: async () => ((called = true), { removed: 9 }) }),
    );
    expect(await store.remove([])).toBe(0);
    expect(called).toBe(false);
  });

  it("remove, removeByConversation devuelven el conteo; respuesta inválida cuenta 0", async () => {
    const store = createIpcAudioStore(() =>
      fakeBridge({
        audioRemove: async () => ({ removed: 2 }),
        audioRemoveConversation: async () => ({ removed: "mucho" }),
      }),
    );
    expect(await store.remove(["a", "b"])).toBe(2);
    expect(await store.removeByConversation("c1")).toBe(0);
  });

  it("removeAll llama al puente", async () => {
    let called = false;
    const store = createIpcAudioStore(() =>
      fakeBridge({ audioRemoveAll: async () => ((called = true), { ok: true }) }),
    );
    await store.removeAll();
    expect(called).toBe(true);
  });

  it("list descarta entradas inválidas y tolera una respuesta que no es lista", async () => {
    const store = createIpcAudioStore(() => fakeBridge({ audioList: async () => [meta("ok"), { id: "../x" }, 7] }));
    expect((await store.list()).map((m) => m.id)).toEqual(["ok"]);
    const raro = createIpcAudioStore(() => fakeBridge({ audioList: async () => "no" }));
    expect(await raro.list()).toEqual([]);
  });

  it("usage valida la respuesta y cae a cero sin puente o con basura", async () => {
    const ok = createIpcAudioStore(() => fakeBridge({ audioUsage: async () => ({ count: 2, bytes: 8 }) }));
    expect(await ok.usage()).toEqual({ count: 2, bytes: 8 });
    const malo = createIpcAudioStore(() => fakeBridge({ audioUsage: async () => ({ count: -1 }) }));
    expect(await malo.usage()).toEqual({ count: 0, bytes: 0 });
    expect(await createIpcAudioStore(() => undefined).usage()).toEqual({ count: 0, bytes: 0 });
  });
});
