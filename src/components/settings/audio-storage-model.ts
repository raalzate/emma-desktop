/** Lógica pura de la tarjeta de audio: formato de megas, tope y agrupación. */
import type { AudioClipMeta, ClipOrigin } from "@/domain/audio/audio-clip";
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

/** Clave estable de un grupo (los intentos sueltos no tienen conversación). */
export const groupKey = (conversationId: string | null): string => conversationId ?? "other";

/** Clips de un grupo, los más nuevos primero. */
export function clipsInGroup(clips: readonly AudioClipMeta[], conversationId: string | null): AudioClipMeta[] {
  return clips
    .filter((c) => (c.conversationId ?? null) === conversationId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

const ORIGIN_LABELS: Record<ClipOrigin, string> = { learner: "Your voice", emma: "EMMA", attempt: "Attempt" };
export const originLabel = (origin: ClipOrigin): string => ORIGIN_LABELS[origin];

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export const formatClipDate = (epochMs: number): string => new Date(epochMs).toISOString().slice(0, 10);
