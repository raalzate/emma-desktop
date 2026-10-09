import { describe, expect, it } from "vitest";
import { ArchiveHistoryOnLevelUpUseCase } from "../archive-history-on-level-up-use-case";
import type { ChatConversation } from "@/domain/chat/chat-conversation";
import type { IChatHistoryRepository } from "@/domain/chat/i-chat-history-repository";

/** Historial falso en memoria; registra los ids guardados. */
class FakeHistory implements IChatHistoryRepository {
  saved: string[] = [];
  constructor(public items: ChatConversation[]) {}
  async list() {
    return this.items;
  }
  async save(c: ChatConversation) {
    this.saved.push(c.id);
    this.items = this.items.map((x) => (x.id === c.id ? c : x));
  }
  async remove() {}
  async rename() {}
}

const conv = (id: string, level: string): ChatConversation => ({
  id, title: id, scenarioType: "s", level, messages: [], turnCount: 0, createdAt: 1, updatedAt: 1,
});
const NOW = "2026-10-09T10:00:00.000Z";

describe("ArchiveHistoryOnLevelUpUseCase", () => {
  it("archiva y guarda solo las conversaciones del nivel anterior", async () => {
    const repo = new FakeHistory([conv("viejo", "A1"), conv("nuevo", "A2")]);
    const n = await new ArchiveHistoryOnLevelUpUseCase(repo, () => NOW).execute("A1");
    expect(n).toBe(1);
    expect(repo.saved).toEqual(["viejo"]);
    expect(repo.items[0].archived).toEqual({ level: "A1", at: NOW });
  });

  it("no guarda nada si no hay qué archivar", async () => {
    const repo = new FakeHistory([conv("a", "B1")]);
    expect(await new ArchiveHistoryOnLevelUpUseCase(repo, () => NOW).execute("A1")).toBe(0);
    expect(repo.saved).toEqual([]);
  });

  it("ignora un nivel previo que no es CEFR", async () => {
    const repo = new FakeHistory([conv("a", "A1")]);
    expect(await new ArchiveHistoryOnLevelUpUseCase(repo, () => NOW).execute("??")).toBe(0);
    expect(repo.saved).toEqual([]);
  });
});
