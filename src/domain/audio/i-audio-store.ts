/**
 * Puerto del almacén de audio (FR-001). El binario no viaja por el store JSON:
 * el adaptador lo guarda aparte. `load` devuelve null si el clip no existe.
 */

import type { AudioClip, AudioClipMeta } from "./audio-clip";

export interface AudioUsage {
  count: number;
  bytes: number;
}

export interface IAudioStore {
  /** Idempotente por id: sobrescribe. */
  save(clip: AudioClip): Promise<void>;
  load(id: string): Promise<AudioClip | null>;
  /** Devuelve cuántos borró realmente. */
  remove(ids: readonly string[]): Promise<number>;
  removeByConversation(conversationId: string): Promise<number>;
  removeAll(): Promise<void>;
  list(): Promise<AudioClipMeta[]>;
  usage(): Promise<AudioUsage>;
}
