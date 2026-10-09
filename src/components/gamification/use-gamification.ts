"use client";

/**
 * Resumen de gamificación vivo: carga del store al montar y se recarga cada vez
 * que se otorga XP (evento XP_AWARDED), así la navegación y Progreso nunca
 * muestran un total viejo.
 */

import { useEffect, useMemo, useState } from "react";
import { getGamificationSummary } from "@/application/gamification/award-xp-use-case";
import type { XpAward } from "@/application/gamification/award-xp-use-case";
import type { GamificationSummary } from "@/domain/gamification/gamification-summary";
import { createGamificationRepository } from "@/infrastructure/persistence/gamification-repository";
import { localTodayAsDays } from "@/interface/today";
import { XP_AWARDED } from "./award-activity";

export function useGamification(): GamificationSummary | null {
  const repo = useMemo(() => createGamificationRepository(), []);
  const [summary, setSummary] = useState<GamificationSummary | null>(null);

  useEffect(() => {
    let alive = true;
    void getGamificationSummary({ repo, today: localTodayAsDays() }).then((s) => {
      if (alive) setSummary(s);
    });
    const onAward = (e: Event) => {
      const award = (e as CustomEvent<XpAward>).detail;
      if (alive && award) setSummary(award.after);
    };
    window.addEventListener(XP_AWARDED, onAward);
    return () => {
      alive = false;
      window.removeEventListener(XP_AWARDED, onAward);
    };
  }, [repo]);

  return summary;
}
