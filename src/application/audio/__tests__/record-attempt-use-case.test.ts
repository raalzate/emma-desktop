import { describe, it, expect } from "vitest";
import { recordAttempt } from "../record-attempt-use-case";
import { attemptClipId } from "@/domain/audio/audio-clip";
import { bytesOf, createFakeSrs, createFakeStore, type FakeSrs, type FakeStore } from "./fakes";

type Args = Parameters<typeof recordAttempt>[0] & { store: FakeStore; srs: FakeSrs };

const args = (over: Partial<Args> = {}): Args => ({
  store: createFakeStore(),
  srs: createFakeSrs(),
  cardId: "card-1",
  text: "I went to the market",
  data: bytesOf(100),
  durationMs: 2500,
  now: 10,
  capBytes: 100_000,
  ...over,
});

describe("recordAttempt (FR-014)", () => {
  it("guarda la lectura como clip attempt ligado a la tarjeta", async () => {
    const a = args();
    const id = await recordAttempt(a);
    expect(id).toBe(attemptClipId("card-1", 10));
    expect((await a.store.load(id as string))?.meta).toMatchObject({ origin: "attempt", cardId: "card-1" });
  });

  it("deja un solo intento vigente por tarjeta, sin tocar los de otras", async () => {
    const store = createFakeStore();
    const srs = createFakeSrs();
    await recordAttempt(args({ store, srs, now: 10 }));
    await recordAttempt(args({ store, srs, cardId: "card-2", now: 11 }));
    const nuevo = await recordAttempt(args({ store, srs, now: 12 }));

    const ids = [...store.clips.keys()].sort();
    expect(ids).toEqual([attemptClipId("card-2", 11), nuevo as string].sort());
  });

  it("no crea tarjetas nuevas ni lanza si el almacén falla; conserva el intento previo", async () => {
    const store = createFakeStore();
    const srs = createFakeSrs();
    const previo = await recordAttempt(args({ store, srs, now: 10 }));
    const roto = createFakeStore({ failSave: true });
    const errores: unknown[] = [];
    expect(await recordAttempt(args({ store: roto, srs, onError: (e: unknown) => errores.push(e) }))).toBeNull();
    expect(errores).toHaveLength(1);
    expect(store.clips.has(previo as string)).toBe(true);
    expect(srs.cards).toHaveLength(0);
  });

  it("texto vacío no guarda", async () => {
    const a = args({ text: " " });
    expect(await recordAttempt(a)).toBeNull();
    expect(a.store.clips.size).toBe(0);
  });
});
