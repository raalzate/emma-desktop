/**
 * Política de tope de almacenamiento de audio (FR-021). Sólo se desalojan clips
 * de tarjetas ya dominadas (caja 5), del más viejo al más nuevo; si no alcanza,
 * se rechaza el clip entrante y no se toca nada (sin desalojo parcial).
 */

import type { LeitnerBox } from "@/domain/srs/leitner";
import type { AudioClipMeta } from "./audio-clip";

export const DEFAULT_AUDIO_CAP_BYTES = 500 * 1024 * 1024;

const EVICTABLE_BOX: LeitnerBox = 5;

export type RetentionPlan =
  | { kind: "fits" }
  | { kind: "evict"; ids: string[] }
  | { kind: "reject" };

export interface RetentionInput {
  clips: readonly AudioClipMeta[];
  incomingBytes: number;
  capBytes: number;
  boxOfClip: (clipId: string) => LeitnerBox | undefined;
}

export function planRetention(input: RetentionInput): RetentionPlan {
  const { clips, incomingBytes, capBytes, boxOfClip } = input;
  const used = clips.reduce((sum, c) => sum + c.bytes, 0);
  let excess = used + incomingBytes - capBytes;
  if (excess <= 0) return { kind: "fits" };

  const candidates = clips
    .filter((c) => boxOfClip(c.id) === EVICTABLE_BOX)
    .sort((a, b) => a.createdAt - b.createdAt);

  const ids: string[] = [];
  for (const clip of candidates) {
    ids.push(clip.id);
    excess -= clip.bytes;
    if (excess <= 0) return { kind: "evict", ids };
  }
  return { kind: "reject" };
}
