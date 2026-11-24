import { describe, it, expect } from "vitest";
import { audioUsage, removeAllClips, removeClips, removeConversationClips } from "../manage-audio-use-case";
import { bytesOf, clipMeta, createFakeStore } from "./fakes";

async function almacen() {
  const store = createFakeStore();
  await store.save({ meta: clipMeta({ id: "a", conversationId: "c1", bytes: 10 }), data: bytesOf(10) });
  await store.save({ meta: clipMeta({ id: "b", conversationId: "c1", bytes: 20 }), data: bytesOf(20) });
  await store.save({ meta: clipMeta({ id: "c", conversationId: "c2", bytes: 30 }), data: bytesOf(30) });
  return store;
}

describe("gestión del audio (FR-020, FR-022)", () => {
  it("usage da conteo y bytes totales", async () => {
    expect(await audioUsage({ store: await almacen() })).toEqual({ count: 3, bytes: 60 });
  });

  it("removeClips borra uno y devuelve cuántos", async () => {
    const store = await almacen();
    expect(await removeClips({ store, ids: ["a", "zzz"] })).toBe(1);
    expect([...store.clips.keys()]).toEqual(["b", "c"]);
  });

  it("removeConversationClips no deja huérfanos de esa conversación", async () => {
    const store = await almacen();
    expect(await removeConversationClips({ store, conversationId: "c1" })).toBe(2);
    expect([...store.clips.keys()]).toEqual(["c"]);
  });

  it("removeAllClips vacía el almacén", async () => {
    const store = await almacen();
    await removeAllClips({ store });
    expect(await audioUsage({ store })).toEqual({ count: 0, bytes: 0 });
  });
});
