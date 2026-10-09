import { describe, it, expect, vi } from "vitest";
import { awardXp, getGamificationSummary } from "../award-xp-use-case";
import type { IGamificationRepository } from "@/domain/gamification/i-gamification-repository";
import type { XpEvent } from "@/domain/gamification/xp-event";

function memoryRepo(initial: XpEvent[] = []): IGamificationRepository & { events: XpEvent[] } {
  const store = { events: [...initial] };
  return {
    get events() {
      return store.events;
    },
    async load() {
      return [...store.events];
    },
    async append(events) {
      store.events = [...store.events, ...events];
    },
  };
}

const WHEN = { at: 1_000, today: 100 };

describe("awardXp", () => {
  it("persiste un evento por actividad y devuelve el desglose", async () => {
    const repo = memoryRepo();
    const award = await awardXp({
      repo,
      activities: [{ kind: "conversation", turns: 3, errors: 0 }, { kind: "scenario-passed" }],
      ...WHEN,
    });
    expect(repo.events).toHaveLength(2);
    expect(award?.xp).toBe(66);
    expect(award?.lines.map((l) => l.label)).toEqual([
      "Conversation",
      "3 turns",
      "Clean session",
      "Scenario passed",
    ]);
  });

  it("informa la subida de nivel de jugador y los logros nuevos", async () => {
    const repo = memoryRepo([{ kind: "review", xp: 90, day: 99, at: 1 }]);
    const award = await awardXp({ repo, activities: [{ kind: "challenge" }], ...WHEN });
    expect(award?.leveledUp).toBe(true);
    expect(award?.after.level.level).toBe(2);
    expect(award?.newAchievements.map((a) => a.id)).toEqual(["challenger"]);
    // 25 XP hoy: la meta diaria (50) todavía no se cumple.
    expect(award?.goalJustMet).toBe(false);
  });

  it("sin actividades no persiste ni celebra", async () => {
    const repo = memoryRepo();
    expect(await awardXp({ repo, activities: [], ...WHEN })).toBeNull();
    expect(repo.events).toEqual([]);
  });

  it("si el repo falla devuelve null y no lanza", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const repo: IGamificationRepository = {
      load: async () => {
        throw new Error("disco");
      },
      append: async () => undefined,
    };
    await expect(awardXp({ repo, activities: [{ kind: "review" }], ...WHEN })).resolves.toBeNull();
    error.mockRestore();
  });
});

describe("getGamificationSummary", () => {
  it("resume los eventos guardados", async () => {
    const repo = memoryRepo([{ kind: "review", xp: 3, day: 100, at: 1 }]);
    const summary = await getGamificationSummary({ repo, today: 100 });
    expect(summary.totalXp).toBe(3);
    expect(summary.streak.activeToday).toBe(true);
  });

  it("si el repo falla devuelve un resumen vacío", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const repo: IGamificationRepository = {
      load: async () => {
        throw new Error("disco");
      },
      append: async () => undefined,
    };
    const summary = await getGamificationSummary({ repo, today: 100 });
    expect(summary.totalXp).toBe(0);
    error.mockRestore();
  });
});
