"use client";

/**
 * Ruta "Práctica": ejercicios cerrados, repaso SRS, laboratorio de
 * pronunciación, plan de estudio y autoevaluación en pestañas.
 */

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEmma } from "@/interface/emma-context";
import { PageHeader } from "@/components/nav/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExerciseDrill } from "@/components/practice/exercise-drill";
import { SrsReview } from "@/components/practice/srs-review";
import { MinimalPairLab } from "@/components/practice/minimal-pair-lab";
import { StudyPlanView } from "@/components/practice/study-plan-view";
import { SelfAssessmentView } from "@/components/practice/self-assessment-view";
import { ChallengeView } from "@/components/practice/challenge-view";

// Mapa de la deep-link ?tab= (recomendaciones de Emma) al value real del Tab;
// "assessment" es el alias usado en las recomendaciones para self-assessment.
const TAB_ALIASES: Record<string, string> = { assessment: "self-assessment" };

function PracticeTabs() {
  const { runtime } = useEmma();
  const params = useSearchParams();

  const requestedTab = params.get("tab");
  const initialTab = (requestedTab && TAB_ALIASES[requestedTab]) || requestedTab || "exercises";
  const initialUnit = params.get("unit");
  const initialExercise = params.get("exercise");
  const initialContrast = params.get("contrast");
  const initialLevel = params.get("level");

  return (
    <Tabs defaultValue={initialTab}>
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
          initialUnit={initialUnit ? Number(initialUnit) : undefined}
          initialExerciseId={initialExercise ?? undefined}
        />
      </TabsContent>
      <TabsContent value="srs">
        <SrsReview runtime={runtime!} />
      </TabsContent>
      <TabsContent value="pronunciation">
        <MinimalPairLab initialContrastId={initialContrast ?? undefined} />
      </TabsContent>
      <TabsContent value="plan">
        <StudyPlanView />
      </TabsContent>
      <TabsContent value="self-assessment">
        <SelfAssessmentView runtime={runtime!} initialLevel={initialLevel ?? undefined} />
      </TabsContent>
      <TabsContent value="challenges">
        <ChallengeView initialUnit={initialUnit ? Number(initialUnit) : undefined} />
      </TabsContent>
    </Tabs>
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
    <>
      <PageHeader title="Práctica" />
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Suspense fallback={null}>
          <PracticeTabs />
        </Suspense>
      </div>
    </>
  );
}
