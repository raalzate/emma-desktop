import { describe, it, expect } from "vitest";
import { saveLearnerTurn } from "../save-learner-turn-use-case";
import { saveClip } from "../save-clip-use-case";
import { audioRecallCardId } from "@/domain/srs/srs-card";
import { learnerClipId } from "@/domain/audio/audio-clip";
import { bytesOf, clipMeta, createFakeSrs, createFakeStore, type FakeSrs, type FakeStore } from "./fakes";

const CAP = 10_000;

type TurnArgs = Parameters<typeof saveLearnerTurn>[0] & { store: FakeStore; srs: FakeSrs };

const turnArgs = (over: Partial<TurnArgs> = {}): TurnArgs => ({
  store: createFakeStore(),
  srs: createFakeSrs(),
  conversationId: "conv-1",
  turn: 1,
  transcript: "I would like a coffee",
  data: bytesOf(200),
  durationMs: 3000,
  now: 1000,
  today: 5,
  capBytes: CAP,
  ...over,
});

describe("saveLearnerTurn", () => {
  it("guarda el clip y crea una tarjeta audio-recall en caja 1 (FR-002, FR-008)", async () => {
    const args = turnArgs();
    const id = await saveLearnerTurn(args);

    expect(id).toBe(learnerClipId("conv-1", 1));
    const saved = await args.store.load(id as string);
    expect(saved?.meta).toMatchObject({
      origin: "learner",
      text: "I would like a coffee",
      conversationId: "conv-1",
      bytes: 200,
      createdAt: 1000,
    });
    expect(args.srs.cards).toHaveLength(1);
    expect(args.srs.cards[0]).toMatchObject({ id: audioRecallCardId(id as string), kind: "audio-recall", box: 1 });
  });

  it("transcripción vacía o en blanco no guarda nada", async () => {
    const args = turnArgs({ transcript: "   " });
    expect(await saveLearnerTurn(args)).toBeNull();
    expect(args.store.clips.size).toBe(0);
    expect(args.srs.cards).toHaveLength(0);
  });

  it("N turnos dan N clips y N tarjetas (SC-001)", async () => {
    const store = createFakeStore();
    const srs = createFakeSrs();
    for (const turn of [1, 2, 3]) await saveLearnerTurn(turnArgs({ store, srs, turn }));
    expect(store.clips.size).toBe(3);
    expect(srs.cards).toHaveLength(3);
  });

  it("reintentar el mismo turno no duplica clip ni tarjeta", async () => {
    const store = createFakeStore();
    const srs = createFakeSrs();
    await saveLearnerTurn(turnArgs({ store, srs }));
    await saveLearnerTurn(turnArgs({ store, srs }));
    expect(store.clips.size).toBe(1);
    expect(srs.cards).toHaveLength(1);
  });

  it("almacén que lanza: no lanza, devuelve null, avisa y no crea tarjeta de audio (FR-006)", async () => {
    const errores: unknown[] = [];
    const args = turnArgs({ store: createFakeStore({ failSave: true }), onError: (e: unknown) => errores.push(e) });
    await expect(saveLearnerTurn(args)).resolves.toBeNull();
    expect(errores).toHaveLength(1);
    expect(args.srs.cards).toHaveLength(0);
  });

  it("clip inválido (demasiado largo) no se guarda", async () => {
    const args = turnArgs({ durationMs: 61_000 });
    expect(await saveLearnerTurn(args)).toBeNull();
    expect(args.store.clips.size).toBe(0);
  });

  it("sobre el tope y sin nada desalojable: rechaza y no toca el almacén", async () => {
    const args = turnArgs({ capBytes: 100 });
    expect(await saveLearnerTurn(args)).toBeNull();
    expect(args.store.clips.size).toBe(0);
  });
});

describe("saveClip", () => {
  const clip = (over = {}) => ({ meta: clipMeta(over), data: bytesOf(100) });

  it("desaloja clips de tarjetas dominadas (caja 5) para hacer sitio", async () => {
    const store = createFakeStore();
    const viejo = clip({ id: "viejo", bytes: 100, createdAt: 1 });
    await store.save(viejo);
    const srs = createFakeSrs([
      { id: "audio-viejo", kind: "audio-recall", box: 5, lastReviewedDay: 0, front: "f", back: "b", audioId: "viejo" },
    ]);

    const res = await saveClip({ store, srs, clip: clip({ id: "nuevo" }), capBytes: 150 });

    expect(res).toEqual({ saved: true });
    expect([...store.clips.keys()]).toEqual(["nuevo"]);
  });

  it("clip inválido devuelve reason invalid; tope devuelve cap; fallo devuelve io", async () => {
    const srs = createFakeSrs();
    expect(await saveClip({ store: createFakeStore(), srs, clip: clip({ text: "" }), capBytes: CAP })).toEqual({
      saved: false,
      reason: "invalid",
    });
    const lleno = createFakeStore();
    await lleno.save(clip({ id: "otro", bytes: 100 }));
    expect(await saveClip({ store: lleno, srs, clip: clip({ id: "x" }), capBytes: 150 })).toEqual({
      saved: false,
      reason: "cap",
    });
    expect(await saveClip({ store: createFakeStore({ failList: true }), srs, clip: clip(), capBytes: CAP })).toEqual({
      saved: false,
      reason: "io",
    });
  });
});
