/**
 * Resumen de gamificación para la UI (#216): nivel de jugador, racha, meta del
 * día, XP de la semana y logros, todo derivado de los eventos. `compareSummaries`
 * dice qué celebrar tras otorgar XP.
 */

import { playerLevelFromXp, type PlayerLevel } from "./player-level";
import { streakFrom, type DailyStreak } from "./daily-streak";
import { statsFromEvents, type GamificationStats } from "./gamification-stats";
import { achievementStatus, newlyUnlocked, type Achievement, type AchievementStatus } from "./achievements";
import type { XpEvent } from "./xp-event";

export const DAILY_XP_GOAL = 50;
const WEEK_DAYS = 7;

export interface DailyGoal {
  target: number;
  earned: number;
  progress: number;
  met: boolean;
}

export interface DayXp {
  day: number;
  xp: number;
}

export interface GamificationSummary {
  totalXp: number;
  level: PlayerLevel;
  streak: DailyStreak;
  dailyGoal: DailyGoal;
  /** Últimos 7 días, del más viejo a hoy. */
  week: DayXp[];
  stats: GamificationStats;
  achievements: AchievementStatus[];
}

export interface SummaryDiff {
  xpGained: number;
  leveledUp: boolean;
  goalJustMet: boolean;
  newAchievements: Achievement[];
}

function xpOnDay(events: readonly XpEvent[], day: number): number {
  return events.reduce((sum, e) => (e.day === day ? sum + e.xp : sum), 0);
}

function dailyGoal(earned: number): DailyGoal {
  return {
    target: DAILY_XP_GOAL,
    earned,
    progress: Math.min(1, earned / DAILY_XP_GOAL),
    met: earned >= DAILY_XP_GOAL,
  };
}

function weekEnding(events: readonly XpEvent[], today: number): DayXp[] {
  return Array.from({ length: WEEK_DAYS }, (_, i) => {
    const day = today - (WEEK_DAYS - 1 - i);
    return { day, xp: xpOnDay(events, day) };
  });
}

export function summarizeGamification(events: readonly XpEvent[], today: number): GamificationSummary {
  const stats = statsFromEvents(events, today);
  return {
    totalXp: stats.totalXp,
    level: playerLevelFromXp(stats.totalXp),
    streak: streakFrom(
      events.map((e) => e.day),
      today,
    ),
    dailyGoal: dailyGoal(xpOnDay(events, today)),
    week: weekEnding(events, today),
    stats,
    achievements: achievementStatus(stats),
  };
}

export function compareSummaries(before: GamificationSummary, after: GamificationSummary): SummaryDiff {
  return {
    xpGained: after.totalXp - before.totalXp,
    leveledUp: after.level.level > before.level.level,
    goalJustMet: after.dailyGoal.met && !before.dailyGoal.met,
    newAchievements: newlyUnlocked(before.stats, after.stats),
  };
}
