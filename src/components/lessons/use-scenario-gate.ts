"use client";

/**
 * Gate de escenas en el renderer (#202): une las lecciones pendientes y las
 * escenas superadas del trazado para que la página del chat, el selector y
 * «Next scene» consulten la MISMA regla de dominio.
 */

import { useCallback, useMemo } from "react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { canSwitchScenario, type ScenarioGateResult } from "@/domain/lessons/scenario-gate";
import { isPathwayItemPassed } from "@/domain/pathway/pathway-item";
import { useProgressData } from "@/components/progress/use-progress-data";
import { currentPathway } from "@/components/progress/pathway-select";
import { useLessonTodos } from "./use-lesson-todos";

export interface ScenarioGate {
  /** false mientras no cargó el trazado: todavía no se puede decidir. */
  ready: boolean;
  check: (target: string, current?: string) => ScenarioGateResult;
}

export function useScenarioGate(runtime: EmmaRuntime | null, level: string | undefined): ScenarioGate {
  const { roadmap } = useProgressData(runtime, level);
  const { todos } = useLessonTodos();

  const passedScenarios = useMemo(
    () => (roadmap ? currentPathway(roadmap).items.filter(isPathwayItemPassed).map((i) => i.scenarioType) : []),
    [roadmap],
  );

  const check = useCallback(
    (target: string, current?: string) =>
      canSwitchScenario({ target, current: current ?? "", todos, passedScenarios }),
    [todos, passedScenarios],
  );

  return { ready: roadmap !== null, check };
}
