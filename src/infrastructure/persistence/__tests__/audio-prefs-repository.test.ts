import { afterEach, describe, expect, it } from "vitest";
import type { EmmaApi } from "@/types/emma-api";
import { DEFAULT_AUDIO_CAP_BYTES } from "@/domain/audio/audio-retention";
import { createAudioPrefsRepository, MIN_AUDIO_CAP_BYTES } from "../audio-prefs-repository";

function useFakeApi(initial: Record<string, unknown> = {}): Record<string, unknown> {
  const memory: Record<string, unknown> = { ...initial };
  const api = {
    storeGet: async (key: string) => (memory[key] as Record<string, unknown>) ?? {},
    storeSet: async (key: string, value: Record<string, unknown>) => {
      memory[key] = value;
      return { ok: true };
    },
  } as unknown as EmmaApi;
  Object.defineProperty(globalThis, "window", { value: { emmaAPI: api }, writable: true, configurable: true });
  return memory;
}

describe("createAudioPrefsRepository", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", { value: undefined, writable: true, configurable: true });
  });

  it("por defecto: tope de 500 MB y aviso sin ver", async () => {
    useFakeApi();
    expect(await createAudioPrefsRepository().load()).toEqual({ capBytes: DEFAULT_AUDIO_CAP_BYTES, noticeSeen: false });
  });

  it("guarda y recupera", async () => {
    useFakeApi();
    const repo = createAudioPrefsRepository();
    await repo.save({ capBytes: 100 * 1024 * 1024, noticeSeen: true });
    expect(await repo.load()).toEqual({ capBytes: 100 * 1024 * 1024, noticeSeen: true });
  });

  it("un tope bajo el mínimo o corrupto vuelve al valor por defecto", async () => {
    useFakeApi({ audioPrefs: { default: { capBytes: MIN_AUDIO_CAP_BYTES - 1, noticeSeen: true } } });
    expect(await createAudioPrefsRepository().load()).toEqual({ capBytes: DEFAULT_AUDIO_CAP_BYTES, noticeSeen: true });
    useFakeApi({ audioPrefs: { default: { capBytes: "x", noticeSeen: "sí" } } });
    expect(await createAudioPrefsRepository().load()).toEqual({ capBytes: DEFAULT_AUDIO_CAP_BYTES, noticeSeen: false });
  });

  it("save rechaza un tope bajo el mínimo (50 MB)", async () => {
    useFakeApi();
    await expect(createAudioPrefsRepository().save({ capBytes: 1, noticeSeen: false })).rejects.toThrow();
  });
});
