/**
 * Borrado en cascada de una conversación: primero el historial (que se espera
 * ANTES de abrir otra sesión, ver `chat-view`) y luego sus clips de audio. Un
 * fallo del audio no revierte el borrado ya hecho: se avisa y se sigue.
 */

import type { AudioFacade } from "@/interface/audio-facade";

export interface DeleteConversationArgs {
  id: string;
  history: { remove(id: string): Promise<void> };
  audio: Pick<AudioFacade, "removeConversation">;
  onError?: (error: unknown) => void;
}

export async function deleteConversation(a: DeleteConversationArgs): Promise<void> {
  await a.history.remove(a.id);
  try {
    await a.audio.removeConversation(a.id);
  } catch (error) {
    a.onError?.(error);
  }
}
