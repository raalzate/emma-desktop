import { describe, it, expect } from "vitest";
import {
  achievementTooltip,
  dailyGoalTooltip,
  levelTooltip,
  streakTooltip,
  weekDayTooltip,
} from "../gamification-tooltips";
import { playerLevelFromXp } from "../player-level";
import { ACHIEVEMENTS } from "../achievements";

describe("tooltips de gamificación", () => {
  it("la racha distingue apagada, en juego y viva", () => {
    expect(streakTooltip({ current: 0, best: 0, activeToday: false })).toMatch(/Sin racha/);
    expect(streakTooltip({ current: 2, best: 2, activeToday: false })).toMatch(/no perderla/);
    expect(streakTooltip({ current: 4, best: 9, activeToday: true })).toMatch(/mejor racha: 9/);
  });

  it("el nivel dice cuánto XP falta", () => {
    expect(levelTooltip(playerLevelFromXp(150))).toMatch(/faltan 150 XP/);
  });

  it("la meta diaria festeja al cumplirse", () => {
    expect(dailyGoalTooltip({ target: 50, earned: 20, progress: 0.4, met: false })).toMatch(/20 de 50/);
    expect(dailyGoalTooltip({ target: 50, earned: 60, progress: 1, met: true })).toMatch(/cumplida/);
  });

  it("el logro bloqueado muestra el avance", () => {
    const a = ACHIEVEMENTS.find((x) => x.id === "week-warrior")!;
    expect(achievementTooltip({ achievement: a, unlocked: false, progress: 2 / 7, current: 2 })).toMatch(/2 de 7/);
    expect(achievementTooltip({ achievement: a, unlocked: true, progress: 1, current: 7 })).toMatch(/desbloqueado/);
  });

  it("el día de la semana nombra hoy", () => {
    expect(weekDayTooltip(0, true)).toBe("Hoy: sin práctica");
    expect(weekDayTooltip(12, false)).toBe("Ese día: 12 XP ganados");
  });
});
