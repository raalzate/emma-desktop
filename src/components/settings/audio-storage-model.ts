/** Lógica pura de la tarjeta de audio: formato de megas, tope y agrupación. */
import type { AudioClipMeta } from "@/domain/audio/audio-clip";
import { MIN_AUDIO_CAP_BYTES } from "@/infrastructure/persistence/audio-prefs-repository";

const MB = 1024 * 1024;

export const formatMb = (bytes: number): string => `${(bytes / MB).toFixed(1)} MB`;

export type CapParse = { ok: true; bytes: number } | { ok: false; error: string };

export function parseCapMb(input: string): CapParse {
  const mb = Number(input.trim());
  const min = MIN_AUDIO_CAP_BYTES / MB;
  if (input.trim() === "" || !Number.isFinite(mb) || mb < min) {
    return { ok: false, error: `The limit must be at least ${min} MB.` };
  }
  return { ok: true, bytes: Math.round(mb * MB) };
}

export interface ConversationGroup {
  conversationId: string | null;
  count: number;
  bytes: number;
}

/** Mayores primero; los clips sin conversación (intentos) quedan al final. */
export function groupByConversation(clips: readonly AudioClipMeta[]): ConversationGroup[] {
  const map = new Map<string | null, ConversationGroup>();
  for (const c of clips) {
    const key = c.conversationId ?? null;
    const g = map.get(key) ?? { conversationId: key, count: 0, bytes: 0 };
    g.count += 1;
    g.bytes += c.bytes;
    map.set(key, g);
  }
  const rank = (g: ConversationGroup) => (g.conversationId === null ? 1 : 0);
  return [...map.values()].sort((a, b) => rank(a) - rank(b) || b.bytes - a.bytes);
}
