"use client";

/**
 * Plan de estudio personal (24 semanas). Antes una pestaña de /practice;
 * ahora su propia ruta (H6, #199). Sin parámetros propios: la semana la
 * decide la unidad activa del aprendiz.
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StudyPlanView } from "@/components/practice/study-plan-view";
import { PracticeRouteShell } from "@/components/practice/practice-route-shell";
import { usePracticePlan } from "@/components/practice/use-practice-plan";
import type { EmmaRuntime } from "@/interface/emma-runtime";

function PlanContent({ runtime }: { runtime: EmmaRuntime }) {
  useSearchParams();
  const { activeUnit, completedChallengeIds } = usePracticePlan(runtime);
  return <StudyPlanView activeUnit={activeUnit} completedChallengeIds={completedChallengeIds} />;
}

export default function PlanPage() {
  return (
    <PracticeRouteShell title="Study plan">
      {(runtime) => (
        <Suspense fallback={null}>
          <PlanContent runtime={runtime} />
        </Suspense>
      )}
    </PracticeRouteShell>
  );
}
