/** Fakes en memoria de los puertos de audio y SRS, compartidos por las pruebas. */

import type { AudioClip, AudioClipMeta } from "@/domain/audio/audio-clip";
import type { IAudioStore } from "@/domain/audio/i-audio-store";
import type { IPhraseVoicer } from "@/domain/audio/i-phrase-voicer";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { SrsCard } from "@/domain/srs/srs-card";

export interface FakeStore extends IAudioStore {
  clips: Map<string, AudioClip>;
  saves: number;
}

export function createFakeStore(opts: { failSave?: boolean; failList?: boolean } = {}): FakeStore {
  const clips = new Map<string, AudioClip>();
  const store: FakeStore = {
    clips,
    saves: 0,
    async save(clip) {
      if (opts.failSave) throw new Error("disco lleno");
      store.saves += 1;
      clips.set(clip.meta.id, clip);
    },
    async load(id) {
      return clips.get(id) ?? null;
    },
    async remove(ids) {
      let n = 0;
      for (const id of ids) if (clips.delete(id)) n += 1;
      return n;
    },
    async removeByConversation(conversationId) {
      const ids = [...clips.values()].filter((c) => c.meta.conversationId === conversationId).map((c) => c.meta.id);
      return store.remove(ids);
    },
    async removeAll() {
      clips.clear();
    },
    async list(): Promise<AudioClipMeta[]> {
      if (opts.failList) throw new Error("IPC caído");
      return [...clips.values()].map((c) => c.meta);
    },
    async usage() {
      const metas = [...clips.values()].map((c) => c.meta);
      return { count: metas.length, bytes: metas.reduce((s, m) => s + m.bytes, 0) };
    },
  };
  return store;
}

export type FakeSrs = ISrsRepository & { cards: SrsCard[] };

export function createFakeSrs(initial: SrsCard[] = []): FakeSrs {
  const repo = {
    cards: [...initial],
    async loadCards() {
      return repo.cards;
    },
    async saveCards(next: SrsCard[]) {
      repo.cards = [...next];
    },
  };
  return repo;
}

export const bytesOf = (n: number): Uint8Array => new Uint8Array(n).fill(1);

export const clipMeta = (overrides: Partial<AudioClipMeta> = {}): AudioClipMeta => ({
  id: "clip-1",
  origin: "learner",
  text: "hello there",
  durationMs: 2000,
  bytes: 100,
  createdAt: 1,
  ...overrides,
});

export type VoicerCall = { text: string; voice: string };

export function createFakeVoicer(
  behaviour: (text: string) => "ok" | "null" | "throw" = () => "ok",
): IPhraseVoicer & { calls: VoicerCall[] } {
  const voicer = {
    calls: [] as VoicerCall[],
    async voice(text: string, voice: string) {
      voicer.calls.push({ text, voice });
      const mode = behaviour(text);
      if (mode === "throw") throw new Error("kokoro caído");
      if (mode === "null") return null;
      return { data: bytesOf(50), durationMs: 1500 };
    },
  };
  return voicer;
}
