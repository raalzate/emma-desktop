/**
 * Guarda la lectura en voz alta del aprendiz como clip `attempt` ligado a una
 * tarjeta (FR-014). Deja un solo intento vigente por tarjeta para no inflar el
 * disco; el anterior sólo se borra si el nuevo quedó guardado. Nunca lanza.
 */

import { attemptClipId } from "@/domain/audio/audio-clip";
import type { IAudioStore } from "@/domain/audio/i-audio-store";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import { saveClip } from "./save-clip-use-case";

export interface RecordAttemptArgs {
  store: IAudioStore;
  srs: ISrsRepository;
  cardId: string;
  /** Texto objetivo de la tarjeta (lo que se leyó). */
  text: string;
  data: Uint8Array;
  durationMs: number;
  now: number;
  capBytes: number;
  onError?: (error: unknown) => void;
}

async function removePreviousAttempts(args: RecordAttemptArgs, keepId: string): Promise<void> {
  try {
    const previous = (await args.store.list())
      .filter((c) => c.origin === "attempt" && c.cardId === args.cardId && c.id !== keepId)
      .map((c) => c.id);
    if (previous.length > 0) await args.store.remove(previous);
  } catch (error) {
    args.onError?.(error);
  }
}

export async function recordAttempt(args: RecordAttemptArgs): Promise<string | null> {
  const text = args.text.trim();
  if (!text) return null;

  const id = attemptClipId(args.cardId, args.now);
  const result = await saveClip({
    store: args.store,
    srs: args.srs,
    clip: {
      meta: {
        id,
        origin: "attempt",
        text,
        cardId: args.cardId,
        durationMs: args.durationMs,
        bytes: args.data.byteLength,
        createdAt: args.now,
      },
      data: args.data,
    },
    capBytes: args.capBytes,
    onError: args.onError,
  });
  if (!result.saved) return null;

  await removePreviousAttempts(args, id);
  return id;
}
