/**
 * Casos de uso de gamificación (#216, FR-007): otorgar XP por actividades y
 * resumir el estado para la UI. El repo se inyecta. La recompensa es un extra:
 * si el repo falla, la actividad que la otorga (cerrar una sesión, calificar
 * una tarjeta) no se rompe — ambos tragan el error y devuelven algo neutro.
 */

import type { IGamificationRepository } from "@/domain/gamification/i-gamification-repository";
import { eventsFor, type XpEvent } from "@/domain/gamification/xp-event";
import { xpBreakdown, type XpActivity, type XpLine } from "@/domain/gamification/xp-rules";
import type { Achievement } from "@/domain/gamification/achievements";
import {
  compareSummaries,
  summarizeGamification,
  type GamificationSummary,
} from "@/domain/gamification/gamification-summary";

export interface XpAward {
  xp: number;
  lines: XpLine[];
  before: GamificationSummary;
  after: GamificationSummary;
  leveledUp: boolean;
  goalJustMet: boolean;
  newAchievements: Achievement[];
}

export async function awardXp({
  repo,
  activities,
  at,
  today,
}: {
  repo: IGamificationRepository;
  activities: XpActivity[];
  at: number;
  today: number;
}): Promise<XpAward | null> {
  if (activities.length === 0) return null;
  try {
    const previous = await repo.load();
    const fresh = eventsFor(activities, { at, day: today });
    await repo.append(fresh);
    const before = summarizeGamification(previous, today);
    const after = summarizeGamification([...previous, ...fresh], today);
    const diff = compareSummaries(before, after);
    return {
      xp: diff.xpGained,
      lines: activities.flatMap(xpBreakdown),
      before,
      after,
      leveledUp: diff.leveledUp,
      goalJustMet: diff.goalJustMet,
      newAchievements: diff.newAchievements,
    };
  } catch (err) {
    console.error("Could not award XP", err);
    return null;
  }
}

export async function getGamificationSummary({
  repo,
  today,
}: {
  repo: IGamificationRepository;
  today: number;
}): Promise<GamificationSummary> {
  let events: XpEvent[] = [];
  try {
    events = await repo.load();
  } catch (err) {
    console.error("Could not read XP history", err);
  }
  return summarizeGamification(events, today);
}
