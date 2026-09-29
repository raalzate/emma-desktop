"use client";

/**
 * Autoevaluación A1→B2. Antes una pestaña de /practice; ahora su propia
 * ruta (H6, #199). Deep-link: ?level= (recomendaciones de Emma).
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SelfAssessmentView } from "@/components/practice/self-assessment-view";
import { PracticeRouteShell } from "@/components/practice/practice-route-shell";
import type { EmmaRuntime } from "@/interface/emma-runtime";

function SelfCheckContent({ runtime }: { runtime: EmmaRuntime }) {
  const params = useSearchParams();
  const level = params.get("level");
  return <SelfAssessmentView runtime={runtime} initialLevel={level ?? undefined} />;
}

export default function SelfCheckPage() {
  return (
    <PracticeRouteShell title="Self-check">
      {(runtime) => (
        <Suspense fallback={null}>
          <SelfCheckContent runtime={runtime} />
        </Suspense>
      )}
    </PracticeRouteShell>
  );
}
