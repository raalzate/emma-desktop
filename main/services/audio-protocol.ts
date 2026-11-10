// =============================================================================
// Protocolo IPC del audio guardado (repaso con audio). Sin Electron: lo comparten
// el servicio de archivos, los handlers y sus pruebas. Todo lo que llega del
// renderer se valida aquí antes de tocar el disco (Artículo 4, FR-005, FR-036).
// =============================================================================

import { z } from 'zod';

export const MAX_CLIP_MS = 60_000;
export const MAX_CLIP_BYTES = 1_500_000;
const MAX_IDS = 5000;

// Sin '/', '\', '..' ni ':' : ningún id puede formar una ruta.
const CLIP_ID = /^[a-z0-9][a-z0-9-]{0,95}$/;
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

const clipIdSchema = z.string().regex(CLIP_ID);
const conversationIdSchema = z.string().regex(SAFE_ID);

const metaSchema = z
  .object({
    id: clipIdSchema,
    origin: z.enum(['learner', 'emma', 'attempt']),
    text: z.string().min(1).max(2000),
    voice: z.string().regex(SAFE_ID).optional(),
    conversationId: conversationIdSchema.optional(),
    cardId: z.string().max(200).optional(),
    durationMs: z.number().int().positive().max(MAX_CLIP_MS),
    bytes: z.number().int().positive().max(MAX_CLIP_BYTES),
    createdAt: z.number().int().nonnegative(),
  })
  .strict();

export type AudioClipMetaWire = z.infer<typeof metaSchema>;

const EBML_MAGIC = [0x1a, 0x45, 0xdf, 0xa3];

/** Cabecera EBML: todo WebM/Matroska empieza con 1A 45 DF A3. */
export function hasWebmMagic(data: Uint8Array): boolean {
  return data.byteLength >= EBML_MAGIC.length && EBML_MAGIC.every((b, i) => data[i] === b);
}

const saveArgsSchema = z
  .object({
    meta: metaSchema,
    mime: z.enum(['audio/webm;codecs=opus', 'audio/webm']),
    data: z.instanceof(Uint8Array),
  })
  .refine((a) => a.data.byteLength === a.meta.bytes, { message: 'bytes no coincide con data' })
  .refine((a) => hasWebmMagic(a.data), { message: 'no es WebM' });

export type SaveArgs = z.infer<typeof saveArgsSchema>;

export const parseSaveArgs = (raw: unknown): SaveArgs => saveArgsSchema.parse(raw);
export const parseClipId = (raw: unknown): string => clipIdSchema.parse(raw);
export const parseIdsArgs = (raw: unknown): string[] => z.array(clipIdSchema).max(MAX_IDS).parse(raw);
export const parseConversationArgs = (raw: unknown): string => conversationIdSchema.parse(raw);
