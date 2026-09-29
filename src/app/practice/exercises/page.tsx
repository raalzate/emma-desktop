"use client";

/**
 * Ejercicios por unidad, ítem a ítem. Antes una pestaña de /practice; ahora
 * su propia ruta (H6, #199). Deep-link: ?unit=&exercise= (recomendaciones de
 * Emma y «Empezar» en Mis lecciones).
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExerciseDrill } from "@/components/practice/exercise-drill";
import { PracticeRouteShell } from "@/components/practice/practice-route-shell";
import { parsePracticeUnit } from "@/domain/practice/practice-deeplink";
import type { EmmaRuntime } from "@/interface/emma-runtime";

function ExercisesContent({ runtime }: { runtime: EmmaRuntime }) {
  const params = useSearchParams();
  const unit = parsePracticeUnit(params.get("unit"));
  const exercise = params.get("exercise");
  return (
    <ExerciseDrill
      key={`ex-${unit ?? "none"}-${exercise ?? ""}`}
      runtime={runtime}
      initialUnit={unit}
      initialExerciseId={exercise ?? undefined}
    />
  );
}

export default function ExercisesPage() {
  return (
    <PracticeRouteShell title="Exercises">
      {(runtime) => (
        <Suspense fallback={null}>
          <ExercisesContent runtime={runtime} />
        </Suspense>
      )}
    </PracticeRouteShell>
  );
}
