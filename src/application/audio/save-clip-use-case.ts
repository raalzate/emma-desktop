/**
 * Guarda un clip respetando el tope de disco (FR-021). Nunca lanza (FR-006):
 * un fallo de almacenamiento no debe interrumpir la práctica; se informa por
 * `onError` y el resultado dice por qué no se guardó.
 */

import { isStorableClip, type AudioClip } from "@/domain/audio/audio-clip";
import type { IAudioStore } from "@/domain/audio/i-audio-store";
import { planRetention } from "@/domain/audio/audio-retention";
import type { LeitnerBox } from "@/domain/srs/leitner";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";

export type SaveClipResult = { saved: true } | { saved: false; reason: "invalid" | "cap" | "io" };

export interface SaveClipArgs {
  store: IAudioStore;
  srs: ISrsRepository;
  clip: AudioClip;
  capBytes: number;
  onError?: (error: unknown) => void;
}

export async function saveClip({ store, srs, clip, capBytes, onError }: SaveClipArgs): Promise<SaveClipResult> {
  if (!isStorableClip(clip.meta)) return { saved: false, reason: "invalid" };
  try {
    // Un reintento del mismo id sobrescribe: no cuenta dos veces contra el tope.
    const clips = (await store.list()).filter((c) => c.id !== clip.meta.id);
    const cards = await srs.loadCards();
    const boxByClip = new Map<string, LeitnerBox>();
    for (const card of cards) if (card.audioId) boxByClip.set(card.audioId, card.box);

    const plan = planRetention({
      clips,
      incomingBytes: clip.meta.bytes,
      capBytes,
      boxOfClip: (id) => boxByClip.get(id),
    });
    if (plan.kind === "reject") return { saved: false, reason: "cap" };
    if (plan.kind === "evict") await store.remove(plan.ids);

    await store.save(clip);
    return { saved: true };
  } catch (error) {
    onError?.(error);
    return { saved: false, reason: "io" };
  }
}
