/**
 * Andamiaje en español de la gamificación (Artículo 9): los tooltips que
 * explican racha, nivel, meta diaria y logros. Viven acá y no en los
 * componentes porque dependen del estado (cuántos días, cuánto falta).
 */

import type { DailyStreak } from "./daily-streak";
import type { PlayerLevel } from "./player-level";
import type { DailyGoal } from "./gamification-summary";
import type { AchievementStatus } from "./achievements";

export function streakTooltip(streak: DailyStreak): string {
  if (streak.current === 0) return "Sin racha todavía: practicá hoy para encender la llama";
  if (!streak.activeToday) return `Racha de ${streak.current} día(s): practicá hoy para no perderla`;
  return `Racha de ${streak.current} día(s) seguidos — tu mejor racha: ${streak.best}`;
}

export function levelTooltip(level: PlayerLevel): string {
  const missing = level.xpForLevel - level.xpIntoLevel;
  return `Nivel de jugador ${level.level}: te faltan ${missing} XP para el siguiente. Sube con la constancia, no reemplaza tu nivel de inglés`;
}

export function dailyGoalTooltip(goal: DailyGoal): string {
  if (goal.met) return `¡Meta del día cumplida! Llevás ${goal.earned} XP hoy`;
  return `Meta diaria: ${goal.earned} de ${goal.target} XP. Cualquier práctica suma`;
}

export function achievementTooltip(status: AchievementStatus): string {
  const { achievement, unlocked, current } = status;
  if (unlocked) return `Logro desbloqueado: ${achievement.hintEs.toLowerCase()}`;
  return `${achievement.hintEs} (${current} de ${achievement.goal})`;
}

export function weekDayTooltip(xp: number, isToday: boolean): string {
  const day = isToday ? "Hoy" : "Ese día";
  return xp === 0 ? `${day}: sin práctica` : `${day}: ${xp} XP ganados`;
}
