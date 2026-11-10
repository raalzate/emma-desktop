import { describe, it, expect, vi } from "vitest";
import { captureEmmaPhrases } from "../capture-emma-phrases-use-case";
import { recordAttempt } from "../record-attempt-use-case";
import { saveLearnerTurn } from "../save-learner-turn-use-case";
import { saveClip } from "../save-clip-use-case";
import { attemptClipId, emmaClipId } from "@/domain/audio/audio-clip";
import type { SrsCard } from "@/domain/srs/srs-card";
import { bytesOf, clipMeta, createFakeSrs, createFakeStore, createFakeVoicer, type FakeSrs } from "./fakes";

/** Repo SRS cuya escritura falla: simula el IPC del almacén caído. */
const srsQueNoGuarda = (): FakeSrs => {
  const srs = createFakeSrs();
  srs.saveCards = async () => {
    throw new Error("srs caído");
  };
  return srs;
};

describe("captureEmmaPhrases: rutas de error", () => {
  const base = () => ({
    store: createFakeStore(),
    srs: createFakeSrs(),
    voicer: createFakeVoicer(),
    voiceKey: "af_heart",
    conversationId: "conv-1",
    now: 500,
    today: 3,
    capBytes: 100_000,
    signal: new AbortController().signal,
    phrases: [{ text: "Good morning", source: "scene" as const }],
  });

  it("si no puede listar los clips existentes, informa y sigue guardando como si no hubiera ninguno", async () => {
    const onError = vi.fn();
    const args = { ...base(), store: createFakeStore({ failList: true }), onError };
    // el fake falla en list() siempre: saveClip también cae, pero la captura no lanza
    const res = await captureEmmaPhrases(args);

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(res).toEqual({ saved: 0, deduped: 0, failed: 1 });
  });

  it("si la tarjeta no se puede persistir, informa por onError y la captura no lanza", async () => {
    const onError = vi.fn();
    const args = { ...base(), srs: srsQueNoGuarda(), onError };
    const res = await captureEmmaPhrases(args);

    expect(res.saved).toBe(1);
    expect(args.store.clips.has(emmaClipId("Good morning", "af_heart"))).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("una frase ya conocida cuya tarjeta no se persiste cuenta como deduplicada e informa el error", async () => {
    const onError = vi.fn();
    const args = { ...base(), onError };
    await captureEmmaPhrases(args);
    const res = await captureEmmaPhrases({ ...args, srs: srsQueNoGuarda() });

    expect(res).toEqual({ saved: 0, deduped: 1, failed: 0 });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("sin onError los fallos se tragan en silencio (no lanza)", async () => {
    const res = await captureEmmaPhrases({ ...base(), srs: srsQueNoGuarda(), store: createFakeStore({ failList: true }) });
    expect(res.failed).toBe(1);
  });
});

describe("recordAttempt: limpieza del intento previo", () => {
  const args = () => ({
    store: createFakeStore(),
    srs: createFakeSrs(),
    cardId: "card-1",
    text: "I went to the market",
    data: bytesOf(100),
    durationMs: 2500,
    now: 10,
    capBytes: 100_000,
  });

  it("si falla el borrado del intento anterior, el nuevo igual queda guardado y se informa", async () => {
    const a = args();
    await recordAttempt({ ...a, now: 5 });
    const onError = vi.fn();
    a.store.remove = async () => {
      throw new Error("no se pudo borrar");
    };

    const id = await recordAttempt({ ...a, onError });

    expect(id).toBe(attemptClipId("card-1", 10));
    expect(a.store.clips.has(id as string)).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("si falla el listado al limpiar, devuelve el id del nuevo clip sin lanzar", async () => {
    const a = args();
    let llamadas = 0;
    const list = a.store.list.bind(a.store);
    a.store.list = async () => {
      llamadas += 1;
      // 1.ª llamada (saveClip) funciona; la 2.ª (limpieza) falla
      if (llamadas > 1) throw new Error("IPC caído");
      return list();
    };
    const onError = vi.fn();

    const id = await recordAttempt({ ...a, onError });

    expect(id).toBe(attemptClipId("card-1", 10));
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("saveLearnerTurn: tarjeta no persistible", () => {
  it("conserva el clip, devuelve su id e informa si la tarjeta no se pudo guardar", async () => {
    const store = createFakeStore();
    const onError = vi.fn();
    const id = await saveLearnerTurn({
      store,
      srs: srsQueNoGuarda(),
      conversationId: "conv-1",
      turn: 1,
      transcript: "I would like a coffee",
      data: bytesOf(200),
      durationMs: 3000,
      now: 1000,
      today: 5,
      capBytes: 10_000,
      onError,
    });

    expect(id).not.toBeNull();
    expect(store.clips.has(id as string)).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("saveClip: tarjetas sin audio asociado", () => {
  it("las tarjetas sin audioId no protegen ningún clip: no interfieren al guardar", async () => {
    const tarjetaTexto = {
      id: "c1",
      kind: "chunk-cloze",
      front: "f",
      back: "b",
      box: 1,
      nextReview: 0,
    } as unknown as SrsCard;
    const store = createFakeStore();
    const srs = createFakeSrs([tarjetaTexto]);

    const res = await saveClip({ store, srs, clip: { meta: clipMeta({ id: "nuevo" }), data: bytesOf(100) }, capBytes: 10_000 });

    expect(res).toEqual({ saved: true });
    expect(store.clips.has("nuevo")).toBe(true);
  });
});
