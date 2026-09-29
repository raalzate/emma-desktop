"use client";

/**
 * Ruta "Práctica": panel «Hoy» (plan del día en el orden del método) sobre
 * las pestañas de ejercicios, repaso SRS, laboratorio de pronunciación, plan
 * de estudio, autoevaluación, retos y la lista de lecciones que EMMA anotó al
 * cerrar cada sesión. Las pestañas son controladas para que el panel pueda
 * abrir la que toca, y siguen la URL (?tab=&unit=) también cuando cambia con
 * la página ya montada: «Empezar» en Mis lecciones navega dentro de /practice.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
import { practiceTargetFromSearch, type PracticeTabValue } from "@/domain/practice/practice-deeplink";
import { getPracticeToday } from "@/application/practice/build-practice-today-use-case";
import { createChallengeRepository } from "@/infrastructure/persistence/challenge-repository";
import { todayAsDays } from "@/interface/today";
import { LessonTodoList } from "@/components/lessons/lesson-todo-list";

interface PlanState {
  plan: PracticePlan | null;
  activeUnit: number | null;
  completedChallengeIds: number[];
}

/**
 * Carga el plan del día; la unidad activa sale del contexto del tutor y los
 * retos hechos del repositorio (los usa el plan de estudio personal).
 * `version` fuerza la recarga cuando una pestaña cambió tarjetas o retos.
 */
function usePracticePlan(runtime: EmmaRuntime, version: number): PlanState {
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
  }, [runtime, challengeRepo, version]);

  return state;
}

function PracticeTabs({ runtime }: { runtime: EmmaRuntime }) {
  const params = useSearchParams();
  const search = params.toString();
  const target = useMemo(() => practiceTargetFromSearch(new URLSearchParams(search)), [search]);
  const initialExercise = params.get("exercise");
  const initialContrast = params.get("contrast");
  const initialLevel = params.get("level");

  const [tab, setTab] = useState<string>(target.tab);
  const [unit, setUnit] = useState<number | undefined>(target.unit);
  const [planVersion, setPlanVersion] = useState(0);
  const { plan, activeUnit, completedChallengeIds } = usePracticePlan(runtime, planVersion);
  const refreshPlan = () => setPlanVersion((v) => v + 1);

  // La URL manda cuando cambia con la página montada (deep-link interno).
  const tabsRef = useRef<HTMLDivElement>(null);
  const firstTarget = useRef(true);
  useEffect(() => {
    setTab(target.tab);
    setUnit(target.unit);
    // Al llegar por deep-link con la página ya montada (p. ej. «Empezar» en
    // Mis lecciones), la pestaña queda debajo de la lista: se lleva a la vista.
    if (firstTarget.current) {
      firstTarget.current = false;
      return;
    }
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [target]);

  function pickStep(step: PracticeStep) {
    if (step.unit !== undefined) setUnit(step.unit);
    const next: PracticeTabValue = step.tab;
    setTab(next);
  }

  return (
    <div className="space-y-4">
      <PracticeToday plan={plan} onPick={pickStep} />
      {/* Fuera de las pestañas: lo que Emma dejó anotado debe verse sin buscarlo. */}
      <section className="space-y-2" aria-labelledby="mis-lecciones">
        <div>
          <p className="font-code text-[11px] uppercase tracking-wide text-muted-foreground">My lessons</p>
          <h2 id="mis-lecciones" className="font-headline text-base font-semibold">
            What Emma left you to practice
          </h2>
        </div>
        <LessonTodoList />
      </section>
      <div ref={tabsRef} className="scroll-mt-4" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="exercises" title="Ejercicios por unidad, ítem a ítem">Exercises</TabsTrigger>
          <TabsTrigger value="srs" title="Repaso espaciado de tus tarjetas">Review</TabsTrigger>
          <TabsTrigger value="pronunciation" title="Pares mínimos y shadowing: escuchá, distinguí y repetí">Pronunciation</TabsTrigger>
          <TabsTrigger value="plan" title="Tu plan de estudio semana a semana">Study plan</TabsTrigger>
          <TabsTrigger value="self-assessment" title="Autoevaluación: marcá lo que ya dominás">Self-check</TabsTrigger>
          <TabsTrigger value="challenges" title="Retos de escritura para cerrar cada unidad">Challenges</TabsTrigger>
        </TabsList>
        <TabsContent value="exercises">
          <ExerciseDrill
            key={`ex-${unit ?? "none"}-${initialExercise ?? ""}`}
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
          <MinimalPairLab key={`mp-${initialContrast ?? ""}`} initialContrastId={initialContrast ?? undefined} />
        </TabsContent>
        <TabsContent value="plan">
          <StudyPlanView activeUnit={activeUnit} completedChallengeIds={completedChallengeIds} />
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
      <PageHeader title="Practice" />
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <Suspense fallback={null}>
          <PracticeTabs runtime={runtime} />
        </Suspense>
      </div>
    </AppShell>
  );
}
