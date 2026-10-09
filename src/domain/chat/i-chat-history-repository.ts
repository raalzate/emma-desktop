/**
 * Puerto del historial de chats: el dominio y la UI dependen de esta interfaz;
 * el adaptador concreto (almacén JSON vía IPC) se inyecta desde la raíz de composición.
 */

import type { ChatConversation } from "./chat-conversation";

export interface IChatHistoryRepository {
  list(): Promise<ChatConversation[]>;
  save(conversation: ChatConversation): Promise<void>;
  remove(id: string): Promise<void>;
  rename(id: string, title: string): Promise<void>;
}
