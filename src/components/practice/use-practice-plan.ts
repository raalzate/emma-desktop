"use client";

/**
 * Plan del día (panel «Hoy»): la unidad activa sale del contexto del tutor y
 * los retos hechos del repositorio. Se extrajo de la ruta /practice (H6,
 * #199) para que sólo la pestaña «Today» lo use.
 */

import { useEffect, useMemo, useState } from "react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { getPracticeToday } from "@/application/practice/build-practice-today-use-case";
import { createChallengeRepository } from "@/infrastructure/persistence/challenge-repository";
import { todayAsDays } from "@/interface/today";
import type { PracticeToday as PracticePlan } from "@/domain/practice/practice-today";

interface PlanState {
  plan: PracticePlan | null;
  activeUnit: number | null;
  completedChallengeIds: number[];
}

export function usePracticePlan(runtime: EmmaRuntime): PlanState {
  const [state, setState] = useState<PlanState>({ plan: null, activeUnit: null, completedChallengeIds: [] });
  const challengeRepo = useMemo(() => createChallengeRepository(), []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const activeUnit = await runtime
        .tutorContext()
        .then((r) => r.context.activeUnit)
        .catch(() => null);
      const [plan, completedChallengeIds] = await Promise.all([
        getPracticeToday({ srsRepo: runtime.repos.srs, challengeRepo, today: todayAsDays(), activeUnit }),
        challengeRepo.loadCompleted().catch(() => []),
      ]);
      if (alive) setState({ plan, activeUnit, completedChallengeIds });
    })();
    return () => {
      alive = false;
    };
  }, [runtime, challengeRepo]);

  return state;
}
