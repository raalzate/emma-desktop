/**
 * Fachada del audio guardado para la UI: ata los casos de uso al almacén, al SRS
 * y a las preferencias (tope), y pone reloj/día inyectados. Las operaciones que
 * escriben tarjetas van en una cola: el store JSON es leer-modificar-escribir y
 * dos capturas en paralelo se pisarían (riesgo 7 del plan).
 */

import type { AudioClip, AudioClipMeta } from "@/domain/audio/audio-clip";
import { DEFAULT_AUDIO_CAP_BYTES } from "@/domain/audio/audio-retention";
import type { AudioUsage, IAudioStore } from "@/domain/audio/i-audio-store";
import type { IPhraseVoicer } from "@/domain/audio/i-phrase-voicer";
import type { PhraseToKeep } from "@/domain/audio/scene-phrases";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import { captureEmmaPhrases, type CaptureEmmaPhrasesResult } from "@/application/audio/capture-emma-phrases-use-case";
import {
  audioUsage,
  removeAllClips,
  removeClips,
  removeConversationClips,
} from "@/application/audio/manage-audio-use-case";
import { recordAttempt } from "@/application/audio/record-attempt-use-case";
import { saveLearnerTurn } from "@/application/audio/save-learner-turn-use-case";
import type { AudioPrefs, IAudioPrefsRepository } from "@/infrastructure/persistence/audio-prefs-repository";

export interface AudioFacade {
  saveLearnerTurn(a: {
    conversationId: string;
    turn: number;
    transcript: string;
    data: Uint8Array;
    durationMs: number;
  }): Promise<string | null>;
  captureEmmaPhrases(a: {
    voicer: IPhraseVoicer;
    phrases: readonly PhraseToKeep[];
    voiceKey: string;
    conversationId: string;
    signal: AbortSignal;
  }): Promise<CaptureEmmaPhrasesResult>;
  recordAttempt(a: { cardId: string; text: string; data: Uint8Array; durationMs: number }): Promise<string | null>;
  load(id: string): Promise<AudioClip | null>;
  /** De los ids dados, los que tienen clip en disco (una sola lectura del índice). */
  has(ids: readonly string[]): Promise<Set<string>>;
  usage(): Promise<AudioUsage>;
  /** Metadatos de todos los clips (Settings agrupa por conversación). */
  list(): Promise<AudioClipMeta[]>;
  removeClips(ids: readonly string[]): Promise<number>;
  removeConversation(conversationId: string): Promise<number>;
  removeAll(): Promise<void>;
  getPrefs(): Promise<AudioPrefs>;
  savePrefs(prefs: AudioPrefs): Promise<void>;
}

export interface AudioFacadeDeps {
  store: IAudioStore;
  srs: ISrsRepository;
  prefs: IAudioPrefsRepository;
  now(): number;
  /** Día SRS de hoy. */
  today(): number;
  onError?: (error: unknown) => void;
}

export function createAudioFacade(deps: AudioFacadeDeps): AudioFacade {
  const { store, srs, prefs } = deps;
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(job: () => Promise<T>): Promise<T> => {
    const run = queue.then(job);
    queue = run.catch(() => undefined);
    return run;
  };
  // Un fallo al leer preferencias no debe impedir guardar: tope por defecto.
  const capBytes = (): Promise<number> =>
    prefs.load().then((p) => p.capBytes, () => DEFAULT_AUDIO_CAP_BYTES);

  return {
    saveLearnerTurn: (a) =>
      enqueue(async () =>
        saveLearnerTurn({
          store, srs, ...a, now: deps.now(), today: deps.today(), capBytes: await capBytes(), onError: deps.onError,
        }),
      ),
    captureEmmaPhrases: (a) =>
      enqueue(async () =>
        captureEmmaPhrases({
          store, srs, ...a, now: deps.now(), today: deps.today(), capBytes: await capBytes(), onError: deps.onError,
        }),
      ),
    recordAttempt: (a) =>
      enqueue(async () =>
        recordAttempt({ store, srs, ...a, now: deps.now(), capBytes: await capBytes(), onError: deps.onError }),
      ),
    load: (id) => store.load(id),
    async has(ids) {
      const wanted = new Set(ids);
      return new Set((await store.list()).map((c) => c.id).filter((id) => wanted.has(id)));
    },
    usage: () => audioUsage({ store }),
    list: () => store.list(),
    removeClips: (ids) => removeClips({ store, ids }),
    removeConversation: (conversationId) => removeConversationClips({ store, conversationId }),
    removeAll: () => removeAllClips({ store }),
    getPrefs: () => prefs.load(),
    savePrefs: (p) => prefs.save(p),
  };
}
