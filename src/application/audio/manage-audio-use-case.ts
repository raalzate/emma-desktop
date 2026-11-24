/**
 * Gestión del audio guardado desde Settings (FR-020, FR-022). Las tarjetas no
 * se tocan: sin clip se degradan solas a texto (FR-009).
 */

import type { AudioUsage, IAudioStore } from "@/domain/audio/i-audio-store";

export const audioUsage = ({ store }: { store: IAudioStore }): Promise<AudioUsage> => store.usage();

export const removeClips = ({ store, ids }: { store: IAudioStore; ids: readonly string[] }): Promise<number> =>
  store.remove(ids);

export const removeConversationClips = ({
  store,
  conversationId,
}: {
  store: IAudioStore;
  conversationId: string;
}): Promise<number> => store.removeByConversation(conversationId);

export const removeAllClips = ({ store }: { store: IAudioStore }): Promise<void> => store.removeAll();
