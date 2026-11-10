import { describe, expect, it } from "vitest";
import { createAudioFacade } from "../audio-facade";
import type { AudioClip, AudioClipMeta } from "@/domain/audio/audio-clip";
import type { IAudioStore } from "@/domain/audio/i-audio-store";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { SrsCard } from "@/domain/srs/srs-card";
import type { IPhraseVoicer } from "@/domain/audio/i-phrase-voicer";
import { DEFAULT_AUDIO_CAP_BYTES } from "@/domain/audio/audio-retention";
import type { IAudioPrefsRepository } from "@/infrastructure/persistence/audio-prefs-repository";

function memoryStore(): IAudioStore & { clips: Map<string, AudioClip> } {
  const clips = new Map<string, AudioClip>();
  return {
    clips,
    save: async (c) => void clips.set(c.meta.id, c),
    load: async (id) => clips.get(id) ?? null,
    remove: async (ids) => ids.filter((id) => clips.delete(id)).length,
    removeByConversation: async (cid) => {
      let n = 0;
      for (const [id, c] of clips) if (c.meta.conversationId === cid && clips.delete(id)) n++;
      return n;
    },
    removeAll: async () => clips.clear(),
    list: async (): Promise<AudioClipMeta[]> => [...clips.values()].map((c) => c.meta),
    usage: async () => ({ count: clips.size, bytes: [...clips.values()].reduce((a, c) => a + c.meta.bytes, 0) }),
  };
}

function memorySrs(): ISrsRepository & { cards: SrsCard[] } {
  const state = { cards: [] as SrsCard[] };
  return {
    get cards() { return state.cards; },
    loadCards: async () => state.cards,
    saveCards: async (c) => void (state.cards = c),
  };
}

const prefs = (capBytes = DEFAULT_AUDIO_CAP_BYTES): IAudioPrefsRepository => ({
  load: async () => ({ capBytes, noticeSeen: false }),
  save: async () => {},
});

function build(over: { prefs?: IAudioPrefsRepository } = {}) {
  const store = memoryStore();
  const srs = memorySrs();
  const facade = createAudioFacade({
    store, srs, prefs: over.prefs ?? prefs(), now: () => 5000, today: () => 100, onError: () => {},
  });
  return { store, srs, facade };
}

const bytes = new Uint8Array(1000);

describe("fachada de audio", () => {
  it("saveLearnerTurn guarda el clip y la tarjeta de dictado con la hora y el día inyectados", async () => {
    const { facade, store, srs } = build();
    const id = await facade.saveLearnerTurn({ conversationId: "c1", turn: 2, transcript: "I goed", data: bytes, durationMs: 2000 });
    expect(id).not.toBeNull();
    expect(store.clips.get(id as string)?.meta.createdAt).toBe(5000);
    expect(srs.cards.some((c) => c.audioId === id)).toBe(true);
  });

  it("respeta el tope de las preferencias: con tope mínimo y clip enorme no se guarda", async () => {
    const { facade, store } = build({ prefs: prefs(500) });
    const id = await facade.saveLearnerTurn({ conversationId: "c1", turn: 1, transcript: "hi there", data: bytes, durationMs: 2000 });
    expect(id).toBeNull();
    expect(store.clips.size).toBe(0);
  });

  it("si las preferencias no cargan, usa el tope por defecto en lugar de fallar", async () => {
    const broken: IAudioPrefsRepository = { load: async () => { throw new Error("ipc"); }, save: async () => {} };
    const { facade } = build({ prefs: broken });
    expect(await facade.saveLearnerTurn({ conversationId: "c", turn: 1, transcript: "hello", data: bytes, durationMs: 2000 })).not.toBeNull();
  });

  it("varias capturas en paralelo no se pisan las tarjetas (cola por fachada)", async () => {
    const { facade, srs } = build();
    await Promise.all(
      [1, 2, 3, 4].map((turn) =>
        facade.saveLearnerTurn({ conversationId: "c", turn, transcript: `phrase ${turn}`, data: bytes, durationMs: 2000 }),
      ),
    );
    expect(srs.cards).toHaveLength(4);
  });

  it("captureEmmaPhrases usa el voicer recibido y guarda el clip de EMMA", async () => {
    const { facade, store } = build();
    const voicer: IPhraseVoicer = { voice: async () => ({ data: bytes, durationMs: 1500 }) };
    const r = await facade.captureEmmaPhrases({
      voicer, phrases: [{ text: "How can I help you today?", source: "scene" }], voiceKey: "bf_emma",
      conversationId: "c1", signal: new AbortController().signal,
    });
    expect(r.saved).toBe(1);
    expect(store.clips.size).toBe(1);
  });

  it("recordAttempt guarda el intento ligado a la tarjeta", async () => {
    const { facade, store } = build();
    const id = await facade.recordAttempt({ cardId: "card-1", text: "How are you?", data: bytes, durationMs: 1200 });
    expect(store.clips.get(id as string)?.meta).toMatchObject({ origin: "attempt", cardId: "card-1" });
  });

  it("has devuelve sólo los ids que existen", async () => {
    const { facade, store } = build();
    const id = await facade.saveLearnerTurn({ conversationId: "c", turn: 1, transcript: "hello", data: bytes, durationMs: 2000 });
    expect(store.clips.size).toBe(1);
    expect([...(await facade.has([id as string, "no-existe"]))]).toEqual([id]);
  });

  it("gestión: usage, borrar por ids, por conversación y todo", async () => {
    const { facade } = build();
    const a = await facade.saveLearnerTurn({ conversationId: "c1", turn: 1, transcript: "one two", data: bytes, durationMs: 2000 });
    await facade.saveLearnerTurn({ conversationId: "c1", turn: 2, transcript: "three four", data: bytes, durationMs: 2000 });
    await facade.saveLearnerTurn({ conversationId: "c2", turn: 1, transcript: "five six", data: bytes, durationMs: 2000 });
    expect((await facade.usage()).count).toBe(3);
    expect(await facade.removeClips([a as string])).toBe(1);
    expect(await facade.removeConversation("c1")).toBe(1);
    await facade.removeAll();
    expect((await facade.usage()).count).toBe(0);
  });

  it("expone y guarda las preferencias (tope y aviso)", async () => {
    const saved: unknown[] = [];
    const p: IAudioPrefsRepository = { load: async () => ({ capBytes: 1, noticeSeen: true }), save: async (v) => void saved.push(v) };
    const { facade } = build({ prefs: p });
    expect(await facade.getPrefs()).toEqual({ capBytes: 1, noticeSeen: true });
    await facade.savePrefs({ capBytes: 2, noticeSeen: true });
    expect(saved).toEqual([{ capBytes: 2, noticeSeen: true }]);
  });
});
