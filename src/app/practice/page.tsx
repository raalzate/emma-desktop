"use client";

/**
 * Ruta "Práctica": dos pestañas nada más. «My lessons» (por defecto) es lo
 * que EMMA anotó al cerrar cada sesión; «Today» es el plan del día en el
 * orden del método. Las cinco secciones que antes eran pestañas (ejercicios,
 * repaso, pronunciación, plan de estudio, retos) dejaron de
 * vivir acá: son rutas propias bajo /practice/* (H6, #199), enlazadas desde
 * el submenú de la barra lateral y desde el panel «Hoy».
 *
 * Compatibilidad: un enlace viejo `/practice?tab=X` (todo anotado o
 * marcador guardado) redirige a la subruta nueva conservando los demás
 * parámetros (`unit`, `exercise`, `contrast`, `level`).
 */

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEmma } from "@/interface/emma-context";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { AppShell } from "@/components/nav/app-shell";
import { PageHeader } from "@/components/nav/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PracticeToday } from "@/components/practice/practice-today";
import { LessonTodoList } from "@/components/lessons/lesson-todo-list";
import { usePracticePlan } from "@/components/practice/use-practice-plan";
import { legacyPracticeRedirect, practiceHrefFor } from "@/domain/practice/practice-deeplink";
import type { PracticeStep } from "@/domain/practice/practice-today";

/** Si la URL trae un `?tab=` viejo, redirige a su subruta y no pinta nada más. */
function LegacyTabRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const target = legacyPracticeRedirect(params);
    if (target) router.replace(target);
  }, [params, router]);

  return null;
}

function PracticeOverview({ runtime }: { runtime: EmmaRuntime }) {
  const router = useRouter();
  const { plan } = usePracticePlan(runtime);

  function pickStep(step: PracticeStep) {
    router.push(practiceHrefFor(step.tab, { unit: step.unit }));
  }

  return (
    <Tabs defaultValue="lessons">
      <TabsList>
        <TabsTrigger value="lessons" title="Lo que EMMA te dejó anotado para practicar">
          My lessons
        </TabsTrigger>
        <TabsTrigger value="today" title="El plan del día en el orden del método">
          Today
        </TabsTrigger>
      </TabsList>
      <TabsContent value="lessons" className="space-y-2">
        <section className="space-y-3 rounded-bubble border border-border bg-card p-4" aria-labelledby="mis-lecciones">
          <div>
            <p className="font-code text-[11px] uppercase tracking-wide text-muted-foreground">My lessons</p>
            <h2 id="mis-lecciones" className="font-headline text-base font-semibold">
              What Emma left you to practice
            </h2>
          </div>
          <LessonTodoList />
        </section>
      </TabsContent>
      <TabsContent value="today">
        <PracticeToday plan={plan} onPick={pickStep} />
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
    <AppShell>
      <PageHeader title="Practice" />
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <Suspense fallback={null}>
          <LegacyTabRedirect />
          <PracticeOverview runtime={runtime} />
        </Suspense>
      </div>
    </AppShell>
  );
}
