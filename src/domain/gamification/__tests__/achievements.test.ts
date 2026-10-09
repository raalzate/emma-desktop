import { describe, it, expect } from "vitest";
import { ACHIEVEMENTS, achievementStatus, newlyUnlocked } from "../achievements";
import { emptyStats, type GamificationStats } from "../gamification-stats";

function stats(over: Partial<GamificationStats>): GamificationStats {
  return { ...emptyStats(), ...over, counts: { ...emptyStats().counts, ...over.counts } };
}

describe("ACHIEVEMENTS", () => {
  it("tiene ids únicos", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada logro tiene meta positiva, título en inglés y pista en español", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.goal).toBeGreaterThan(0);
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.hintEs.length).toBeGreaterThan(0);
    }
  });

  it("sin actividad no hay logros desbloqueados", () => {
    expect(achievementStatus(emptyStats()).filter((s) => s.unlocked)).toEqual([]);
  });
});

describe("achievementStatus", () => {
  it("desbloquea la primera conversación con una conversación", () => {
    const s = achievementStatus(stats({ counts: { conversation: 1 } as GamificationStats["counts"] }));
    expect(s.find((x) => x.achievement.id === "first-words")?.unlocked).toBe(true);
  });

  it("reporta el progreso acotado hacia la meta", () => {
    const s = achievementStatus(stats({ bestStreak: 2 }));
    const week = s.find((x) => x.achievement.id === "week-warrior");
    expect(week?.unlocked).toBe(false);
    expect(week?.progress).toBeCloseTo(2 / 7);
    const fire = s.find((x) => x.achievement.id === "on-fire");
    expect(fire?.progress).toBeCloseTo(2 / 3);
  });

  it("el progreso nunca pasa de 1", () => {
    const s = achievementStatus(stats({ totalXp: 999_999 }));
    expect(s.every((x) => x.progress <= 1)).toBe(true);
  });

  it("la sesión limpia se desbloquea con sesiones sin errores", () => {
    const s = achievementStatus(stats({ cleanSessions: 1 }));
    expect(s.find((x) => x.achievement.id === "clean-sheet")?.unlocked).toBe(true);
  });
});

describe("newlyUnlocked", () => {
  it("devuelve sólo lo que se desbloqueó entre antes y después", () => {
    const before = stats({ bestStreak: 2, cleanSessions: 1 });
    const after = stats({ bestStreak: 3, cleanSessions: 1 });
    expect(newlyUnlocked(before, after).map((a) => a.id)).toEqual(["on-fire"]);
  });

  it("vacío si nada cambió", () => {
    const s = stats({ totalXp: 2000 });
    expect(newlyUnlocked(s, s)).toEqual([]);
  });
});
