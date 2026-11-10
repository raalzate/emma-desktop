/**
 * Preferencias del audio guardado (clave "audioPrefs"): tope de almacenamiento
 * y si ya se mostró el aviso de privacidad (FR-021, FR-023). Lo corrupto o bajo
 * el mínimo vuelve al valor por defecto en vez de lanzar.
 */

import { DEFAULT_AUDIO_CAP_BYTES } from "@/domain/audio/audio-retention";
import { readOne, writeOne } from "./store-client";

const KEY = "audioPrefs";

export const MIN_AUDIO_CAP_BYTES = 50 * 1024 * 1024;

export interface AudioPrefs {
  capBytes: number;
  noticeSeen: boolean;
}

export interface IAudioPrefsRepository {
  load(): Promise<AudioPrefs>;
  save(prefs: AudioPrefs): Promise<void>;
}

const isValidCap = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= MIN_AUDIO_CAP_BYTES;

export function createAudioPrefsRepository(): IAudioPrefsRepository {
  return {
    async load() {
      const stored = await readOne<Record<string, unknown>>(KEY);
      return {
        capBytes: isValidCap(stored?.capBytes) ? stored.capBytes : DEFAULT_AUDIO_CAP_BYTES,
        noticeSeen: stored?.noticeSeen === true,
      };
    },
    async save(prefs) {
      if (!isValidCap(prefs.capBytes)) throw new Error("El tope de audio no alcanza el mínimo (50 MB)");
      await writeOne<AudioPrefs>(KEY, prefs);
    },
  };
}
