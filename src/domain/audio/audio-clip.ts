/**
 * Clip de audio guardado para el repaso: metadatos, ids deterministas y regla
 * de qué clips valen la pena guardar. Dominio puro: el hash es FNV-1a propio
 * (sin `crypto`) para que el id de una frase de EMMA sea estable y deduplique.
 */

export type ClipOrigin = "learner" | "emma" | "attempt";

export const CLIP_MIME = "audio/webm;codecs=opus" as const;
export const MAX_CLIP_SECONDS = 60;
/** Margen sobre 60 s a 32 kbps (~240 KB). */
export const MAX_CLIP_BYTES = 1_500_000;
export const CLIP_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,95}$/;

export interface AudioClipMeta {
  /** Cumple CLIP_ID_PATTERN; también es el nombre del archivo. */
  id: string;
  origin: ClipOrigin;
  /** Transcripción (learner), frase (emma) o texto objetivo (attempt). */
  text: string;
  /** Clave de voz Kokoro (emma); ausente en learner/attempt. */
  voice?: string;
  /** Dueño para el borrado en cascada. */
  conversationId?: string;
  /** Attempt: tarjeta a la que pertenece. */
  cardId?: string;
  durationMs: number;
  bytes: number;
  /** Epoch ms; lo inyecta el llamador. */
  createdAt: number;
}

export interface AudioClip {
  meta: AudioClipMeta;
  data: Uint8Array;
}

const FNV_PRIME = 0x01000193;
const FNV_OFFSET_A = 0x811c9dc5;
const FNV_OFFSET_B = 0x9747b28c;

function fnv1a32(text: string, offset: number): number {
  let h = offset;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME);
  }
  return h >>> 0;
}

const hex8 = (n: number) => n.toString(16).padStart(8, "0");

/** FNV-1a doble (dos semillas) en 16 hex: estable entre ejecuciones y puro. */
export function stableHash(text: string): string {
  return hex8(fnv1a32(text, FNV_OFFSET_A)) + hex8(fnv1a32(text, FNV_OFFSET_B));
}

const normalizePhrase = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();

const SLUG_MAX = 40;

/** Slug legible + hash corto: dos textos que se parecen no colisionan. */
function slugOf(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
  const hash = stableHash(text).slice(0, 8);
  return slug ? `${slug}-${hash}` : hash;
}

/** Misma frase y misma voz => mismo id (dedupe). */
export function emmaClipId(text: string, voice: string): string {
  return `emma-${stableHash(`${normalizePhrase(text)}|${voice}`)}`;
}

/** Idempotente: el mismo turno de la misma conversación da el mismo id. */
export function learnerClipId(conversationId: string, turn: number): string {
  return `learner-${slugOf(conversationId)}-${turn}`;
}

export function attemptClipId(cardId: string, at: number): string {
  return `attempt-${slugOf(cardId)}-${at}`;
}

/** Texto no vacío, duración positiva hasta 60 s y tamaño dentro del tope. */
export function isStorableClip(m: Pick<AudioClipMeta, "text" | "durationMs" | "bytes">): boolean {
  if (m.text.trim().length === 0) return false;
  if (m.durationMs <= 0 || m.durationMs > MAX_CLIP_SECONDS * 1000) return false;
  return m.bytes > 0 && m.bytes <= MAX_CLIP_BYTES;
}
