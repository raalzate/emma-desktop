/**
 * Guarda la nota de voz de un turno hablado del aprendiz y su tarjeta de
 * dictado (FR-002, FR-008). Sin transcripción no hay nada que dictar. Nunca
 * lanza: devuelve el id del clip (para el mapa turno→clip) o null.
 */

import { learnerClipId } from "@/domain/audio/audio-clip";
import type { IAudioStore } from "@/domain/audio/i-audio-store";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import { buildAudioRecallCard } from "@/domain/srs/srs-card";
import { addCards } from "@/application/srs/review-session-use-case";
import { saveClip } from "./save-clip-use-case";

export interface SaveLearnerTurnArgs {
  store: IAudioStore;
  srs: ISrsRepository;
  conversationId: string;
  turn: number;
  transcript: string;
  data: Uint8Array;
  durationMs: number;
  /** Epoch ms y día SRS inyectados (sin Date en el caso de uso). */
  now: number;
  today: number;
  capBytes: number;
  onError?: (error: unknown) => void;
}

export async function saveLearnerTurn(args: SaveLearnerTurnArgs): Promise<string | null> {
  const text = args.transcript.trim();
  if (!text) return null;

  const meta = {
    id: learnerClipId(args.conversationId, args.turn),
    origin: "learner" as const,
    text,
    conversationId: args.conversationId,
    durationMs: args.durationMs,
    bytes: args.data.byteLength,
    createdAt: args.now,
  };
  const result = await saveClip({
    store: args.store,
    srs: args.srs,
    clip: { meta, data: args.data },
    capBytes: args.capBytes,
    onError: args.onError,
  });
  if (!result.saved) return null;

  try {
    await addCards({ repo: args.srs, cards: [buildAudioRecallCard(meta, args.today)] });
  } catch (error) {
    args.onError?.(error);
  }
  return meta.id;
}
