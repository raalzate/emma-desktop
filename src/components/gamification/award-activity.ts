"use client";

/**
 * Puerta única del renderer para otorgar XP (#216). Cablea el repo concreto al
 * caso de uso y anuncia el premio con un evento de ventana: la capa de
 * celebración y la tarjeta de la navegación lo escuchan sin store global.
 *
 * Los premios se encadenan: dos ítems respondidos seguidos leen y escriben la
 * misma colección, y en paralelo uno pisaría al otro.
 */

import { awardXp, type XpAward } from "@/application/gamification/award-xp-use-case";
import type { XpActivity } from "@/domain/gamification/xp-rules";
import { createGamificationRepository } from "@/infrastructure/persistence/gamification-repository";
import { localTodayAsDays } from "@/interface/today";

export const XP_AWARDED = "emma:xp-awarded";

let queue: Promise<unknown> = Promise.resolve();

function announce(award: XpAward): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<XpAward>(XP_AWARDED, { detail: award }));
}

export function awardActivities(activities: XpActivity[]): Promise<XpAward | null> {
  const run = queue.then(async () => {
    const award = await awardXp({
      repo: createGamificationRepository(),
      activities,
      at: Date.now(),
      today: localTodayAsDays(),
    });
    if (award) announce(award);
    return award;
  });
  queue = run.catch(() => undefined);
  return run;
}
