/**
 * Adaptador de `IAudioStore` sobre el puente del main (`window.emmaAPI.audio*`).
 * El binario viaja por structured clone y se guarda fuera del store JSON. La
 * respuesta del main también es un borde: se valida con Zod antes de devolverla.
 * El puente es inyectable para probar sin Electron (patrón de store-client.ts).
 */

import { z } from "zod";
import { CLIP_ID_PATTERN, CLIP_MIME, type AudioClip, type AudioClipMeta } from "@/domain/audio/audio-clip";
import type { AudioUsage, IAudioStore } from "@/domain/audio/i-audio-store";
import type { EmmaApi } from "@/types/emma-api";

export type AudioBridge = Pick<
  EmmaApi,
  "audioSave" | "audioRead" | "audioRemove" | "audioRemoveConversation" | "audioRemoveAll" | "audioList" | "audioUsage"
>;

const metaSchema = z.object({
  id: z.string().regex(CLIP_ID_PATTERN),
  origin: z.enum(["learner", "emma", "attempt"]),
  text: z.string(),
  voice: z.string().optional(),
  conversationId: z.string().optional(),
  cardId: z.string().optional(),
  durationMs: z.number().nonnegative(),
  bytes: z.number().nonnegative(),
  createdAt: z.number().nonnegative(),
});

const clipSchema = z.object({ meta: metaSchema, data: z.instanceof(Uint8Array) });
const removedSchema = z.object({ removed: z.number().int().nonnegative() });
const usageSchema = z.object({ count: z.number().int().nonnegative(), bytes: z.number().nonnegative() });

const EMPTY_USAGE: AudioUsage = { count: 0, bytes: 0 };

const defaultBridge = (): AudioBridge | undefined => (typeof window !== "undefined" ? window.emmaAPI : undefined);

export function createIpcAudioStore(getBridge: () => AudioBridge | undefined = defaultBridge): IAudioStore {
  const removedCount = (raw: unknown): number => {
    const r = removedSchema.safeParse(raw);
    return r.success ? r.data.removed : 0;
  };

  return {
    async save(clip: AudioClip) {
      const bridge = getBridge();
      if (!bridge) throw new Error("Audio store no disponible fuera de Electron");
      const res = await bridge.audioSave({ meta: clip.meta, mime: CLIP_MIME, data: clip.data });
      if (!res.ok) throw new Error(`No se pudo guardar el clip (${res.error})`);
    },

    async load(id) {
      const raw = await getBridge()?.audioRead(id);
      const parsed = clipSchema.safeParse(raw);
      return parsed.success ? parsed.data : null;
    },

    async remove(ids) {
      const bridge = getBridge();
      if (!bridge || ids.length === 0) return 0;
      return removedCount(await bridge.audioRemove([...ids]));
    },

    async removeByConversation(conversationId) {
      const bridge = getBridge();
      if (!bridge) return 0;
      return removedCount(await bridge.audioRemoveConversation(conversationId));
    },

    async removeAll() {
      await getBridge()?.audioRemoveAll();
    },

    async list() {
      const raw: unknown = await getBridge()?.audioList();
      if (!Array.isArray(raw)) return [];
      const metas: AudioClipMeta[] = [];
      for (const entry of raw) {
        const parsed = metaSchema.safeParse(entry);
        if (parsed.success) metas.push(parsed.data);
      }
      return metas;
    },

    async usage() {
      const parsed = usageSchema.safeParse(await getBridge()?.audioUsage());
      return parsed.success ? parsed.data : EMPTY_USAGE;
    },
  };
}
