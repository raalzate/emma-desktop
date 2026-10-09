/** Estadísticas agregadas de los eventos de XP: la entrada de los logros. */

import { XP_ACTIVITY_KINDS, type XpActivityKind } from "./xp-rules";
import { streakFrom } from "./daily-streak";
import type { XpEvent } from "./xp-event";

export interface GamificationStats {
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  counts: Record<XpActivityKind, number>;
  cleanSessions: number;
}

function zeroCounts(): Record<XpActivityKind, number> {
  return Object.fromEntries(XP_ACTIVITY_KINDS.map((k) => [k, 0])) as Record<XpActivityKind, number>;
}

export function emptyStats(): GamificationStats {
  return { totalXp: 0, currentStreak: 0, bestStreak: 0, counts: zeroCounts(), cleanSessions: 0 };
}

export function statsFromEvents(events: readonly XpEvent[], today: number): GamificationStats {
  const counts = zeroCounts();
  let totalXp = 0;
  let cleanSessions = 0;
  for (const e of events) {
    counts[e.kind] += 1;
    totalXp += e.xp;
    if (e.clean) cleanSessions += 1;
  }
  const streak = streakFrom(
    events.map((e) => e.day),
    today,
  );
  return { totalXp, currentStreak: streak.current, bestStreak: streak.best, counts, cleanSessions };
}
