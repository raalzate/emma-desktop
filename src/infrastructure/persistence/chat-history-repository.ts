/**
 * Repositorio del historial de chats sobre el almacén JSON. Guarda todas las
 * conversaciones del aprendiz en un bucket bajo LOCAL_USER y expone CRUD simple.
 */

import type { ChatConversation } from "@/domain/chat/chat-conversation";
import { readCollection, writeOne, LOCAL_USER } from "./store-client";

const KEY = "chatConversations";

interface Bucket {
  conversations: ChatConversation[];
}

async function loadBucket(): Promise<Bucket> {
  const all = await readCollection<Bucket>(KEY);
  return all[LOCAL_USER] ?? { conversations: [] };
}

export interface ChatHistoryRepository {
  list(): Promise<ChatConversation[]>;
  save(conversation: ChatConversation): Promise<void>;
  remove(id: string): Promise<void>;
  rename(id: string, title: string): Promise<void>;
}

export function createChatHistoryRepository(): ChatHistoryRepository {
  return {
    async list() {
      const { conversations } = await loadBucket();
      return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    },
    async save(conversation) {
      const bucket = await loadBucket();
      const idx = bucket.conversations.findIndex((c) => c.id === conversation.id);
      if (idx >= 0) bucket.conversations[idx] = conversation;
      else bucket.conversations.push(conversation);
      await writeOne(KEY, bucket);
    },
    async remove(id) {
      const bucket = await loadBucket();
      bucket.conversations = bucket.conversations.filter((c) => c.id !== id);
      await writeOne(KEY, bucket);
    },
    async rename(id, title) {
      const bucket = await loadBucket();
      const c = bucket.conversations.find((x) => x.id === id);
      if (c) {
        c.title = title;
        c.updatedAt = Date.now();
        await writeOne(KEY, bucket);
      }
    },
  };
}
