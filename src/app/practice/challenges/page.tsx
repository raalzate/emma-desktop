"use client";

/**
 * Retos de escritura para cerrar cada unidad. Antes una pestaña de
 * /practice; ahora su propia ruta (H6, #199). Deep-link: ?unit=.
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChallengeView } from "@/components/practice/challenge-view";
import { PracticeRouteShell } from "@/components/practice/practice-route-shell";
import { parsePracticeUnit } from "@/domain/practice/practice-deeplink";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import { useEmma } from "@/interface/emma-context";

function ChallengesContent({ runtime }: { runtime: EmmaRuntime }) {
  const params = useSearchParams();
  const { profile } = useEmma();
  const unit = parsePracticeUnit(params.get("unit"));
  return <ChallengeView key={`ch-${unit ?? "none"}`} runtime={runtime} initialUnit={unit} level={profile?.englishLevel} />;
}

export default function ChallengesPage() {
  return (
    <PracticeRouteShell title="Challenges">
      {(runtime) => (
        <Suspense fallback={null}>
          <ChallengesContent runtime={runtime} />
        </Suspense>
      )}
    </PracticeRouteShell>
  );
}
