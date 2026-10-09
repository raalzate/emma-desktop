"use client";

/**
 * Gestiona la lista de conversaciones persistidas: carga, upsert (persist),
 * renombrar y eliminar. El repositorio entra por el puerto (se cablea en la raíz de composición).
 */

import { useCallback, useEffect, useState } from "react";
import type { IChatHistoryRepository } from "@/domain/chat/i-chat-history-repository";
import type { ChatConversation } from "@/domain/chat/chat-conversation";

export function useChatHistory(repo: IChatHistoryRepository) {
  const [list, setList] = useState<ChatConversation[]>([]);

  const refresh = useCallback(async () => {
    setList(await repo.list());
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persist = useCallback(
    async (conversation: ChatConversation) => {
      await repo.save(conversation);
      await refresh();
    },
    [repo, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await repo.remove(id);
      await refresh();
    },
    [repo, refresh],
  );

  const rename = useCallback(
    async (id: string, title: string) => {
      await repo.rename(id, title);
      await refresh();
    },
    [repo, refresh],
  );

  return { list, persist, remove, rename, refresh };
}
