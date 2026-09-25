"use client";

/**
 * Ruta "Práctica": panel «Hoy» (plan del día en el orden del método) sobre
 * las pestañas de ejercicios, repaso SRS, laboratorio de pronunciación, plan
 * de estudio, autoevaluación y retos. Las pestañas son controladas para que
 * el panel pueda abrir la que toca.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEmma } from "@/interface/emma-context";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { AppShell } from "@/components/nav/app-shell";
import { PageHeader } from "@/components/nav/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExerciseDrill } from "@/components/practice/exercise-drill";
import { SrsReview } from "@/components/practice/srs-review";
import { MinimalPairLab } from "@/components/practice/minimal-pair-lab";
import { StudyPlanView } from "@/components/practice/study-plan-view";
import { SelfAssessmentView } from "@/components/practice/self-assessment-view";
import { ChallengeView } from "@/components/practice/challenge-view";
import { PracticeToday } from "@/components/practice/practice-today";
import type { PracticeStep, PracticeToday as PracticePlan } from "@/domain/practice/practice-today";
import { getPracticeToday } from "@/application/practice/build-practice-today-use-case";
import { createChallengeRepository } from "@/infrastructure/persistence/challenge-repository";
import { todayAsDays } from "@/interface/today";

// Mapa de la deep-link ?tab= (recomendaciones de Emma) al value real del Tab;
// "assessment" es el alias usado en las recomendaciones para self-assessment.
const TAB_ALIASES: Record<string, string> = { assessment: "self-assessment" };

/**
 * Carga el plan del día; la unidad activa sale del contexto del tutor.
 * `version` fuerza la recarga cuando una pestaña cambió tarjetas o retos.
 */
function usePracticePlan(runtime: EmmaRuntime, version: number): PracticePlan | null {
  const [plan, setPlan] = useState<PracticePlan | null>(null);
  const challengeRepo = useMemo(() => createChallengeRepository(), []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const activeUnit = await runtime
        .tutorContext()
        .then((r) => r.context.activeUnit)
        .catch(() => null);
      const next = await getPracticeToday({
        srsRepo: runtime.repos.srs,
        challengeRepo,
        today: todayAsDays(),
        activeUnit,
      });
      if (alive) setPlan(next);
    })();
    return () => {
      alive = false;
    };
  }, [runtime, challengeRepo, version]);

  return plan;
}

function PracticeTabs({ runtime }: { runtime: EmmaRuntime }) {
  const params = useSearchParams();

  const requestedTab = params.get("tab");
  const initialTab = (requestedTab && TAB_ALIASES[requestedTab]) || requestedTab || "exercises";
  const initialUnit = params.get("unit");
  const initialExercise = params.get("exercise");
  const initialContrast = params.get("contrast");
  const initialLevel = params.get("level");

  const [tab, setTab] = useState(initialTab);
  const [unit, setUnit] = useState<number | undefined>(initialUnit ? Number(initialUnit) : undefined);
  const [planVersion, setPlanVersion] = useState(0);
  const plan = usePracticePlan(runtime, planVersion);
  const refreshPlan = () => setPlanVersion((v) => v + 1);

  function pickStep(step: PracticeStep) {
    if (step.unit !== undefined) setUnit(step.unit);
    setTab(step.tab);
  }

  return (
    <div className="space-y-4">
      <PracticeToday plan={plan} onPick={pickStep} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
          <TabsTrigger value="srs">Repaso</TabsTrigger>
          <TabsTrigger value="pronunciation">Pronunciación</TabsTrigger>
          <TabsTrigger value="plan">Plan de estudio</TabsTrigger>
          <TabsTrigger value="self-assessment">Autoevaluación</TabsTrigger>
          <TabsTrigger value="challenges">Retos</TabsTrigger>
        </TabsList>
        <TabsContent value="exercises">
          <ExerciseDrill
            key={`ex-${unit ?? "none"}`}
            runtime={runtime}
            initialUnit={unit}
            initialExerciseId={initialExercise ?? undefined}
            onChange={refreshPlan}
          />
        </TabsContent>
        <TabsContent value="srs">
          <SrsReview runtime={runtime} onChange={refreshPlan} />
        </TabsContent>
        <TabsContent value="pronunciation">
          <MinimalPairLab initialContrastId={initialContrast ?? undefined} />
        </TabsContent>
        <TabsContent value="plan">
          <StudyPlanView />
        </TabsContent>
        <TabsContent value="self-assessment">
          <SelfAssessmentView runtime={runtime} initialLevel={initialLevel ?? undefined} />
        </TabsContent>
        <TabsContent value="challenges">
          <ChallengeView key={`ch-${unit ?? "none"}`} runtime={runtime} initialUnit={unit} onChange={refreshPlan} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PracticePage() {
  const { runtime, profile, ready } = useEmma();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);

  if (!ready || !runtime) return null;
  if (!profile) return null; // redirigiendo al onboarding

  return (
    <AppShell>
      <PageHeader title="Práctica" />
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
        <Suspense fallback={null}>
          <PracticeTabs runtime={runtime} />
        </Suspense>
      </div>
    </AppShell>
  );
}
