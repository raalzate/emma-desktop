"use client";

/** Composición de la vista de progreso una vez hay runtime y nivel resueltos. */

import type { EmmaRuntime } from "@/interface/emma-runtime";
import { Separator } from "@/components/ui/separator";
import { useProgressData } from "./use-progress-data";
import { currentPathway } from "./pathway-select";
import { CurrentLevelHeader } from "./current-level-header";
import { PathwayProgress } from "./pathway-progress";
import { PathwayTrail } from "./pathway-trail";
import { RecommendedNext } from "./recommended-next";
import { StudyPlanCard } from "./study-plan-card";
import { MetricsCard } from "./metrics-card";
import { ResetLevelButton } from "./reset-level-button";
import { ProgressSkeleton } from "./progress-skeleton";

export function ProgressView({ runtime, level }: { runtime: EmmaRuntime; level: string }) {
  const { roadmap, recommendation, loading, reload } = useProgressData(runtime, level);
  if (loading || !roadmap) return <ProgressSkeleton />;
  const pathway = currentPathway(roadmap);
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <CurrentLevelHeader level={level} />
      <StudyPlanCard runtime={runtime} />
      <MetricsCard runtime={runtime} />
      <PathwayProgress pathway={pathway} level={level} />
      <RecommendedNext recommendation={recommendation} />
      <Separator />
      <PathwayTrail pathway={pathway} recommendedType={recommendation?.scenarioType} />
      <div className="flex justify-end pt-2">
        <ResetLevelButton repo={runtime.repos.pathway} level={level} onReset={reload} />
      </div>
    </div>
  );
}
