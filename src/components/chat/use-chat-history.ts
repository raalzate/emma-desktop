"use client";

/**
 * Gestiona la lista de conversaciones persistidas: carga, upsert (persist),
 * renombrar y eliminar. El repositorio vive sobre el almacén JSON local.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createChatHistoryRepository } from "@/infrastructure/persistence/chat-history-repository";
import type { ChatConversation } from "@/domain/chat/chat-conversation";

export function useChatHistory() {
  const repo = useMemo(() => createChatHistoryRepository(), []);
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
