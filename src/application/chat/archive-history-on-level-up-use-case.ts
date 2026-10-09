/** Al subir de nivel, archiva las conversaciones del nivel superado (FR-008). */

import { isCefrLevel } from "@/domain/cefr/cefr-ladder";
import { archiveForLevelUp } from "@/domain/chat/chat-conversation";
import type { IChatHistoryRepository } from "@/domain/chat/i-chat-history-repository";

export class ArchiveHistoryOnLevelUpUseCase {
  constructor(
    private readonly history: IChatHistoryRepository,
    private readonly now: () => string,
  ) {}

  /** Devuelve cuántas conversaciones se archivaron. */
  async execute(fromLevel: string): Promise<number> {
    if (!isCefrLevel(fromLevel)) return 0;
    const before = await this.history.list();
    const after = archiveForLevelUp(before, fromLevel, this.now());
    const changed = after.filter((c, i) => c !== before[i]);
    for (const c of changed) await this.history.save(c);
    return changed.length;
  }
}
