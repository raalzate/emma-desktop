"use client";

/**
 * Laboratorio de sonidos: pares mínimos y shadowing. Antes una pestaña de
 * /practice; ahora su propia ruta (H6, #199). Deep-link: ?contrast=.
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MinimalPairLab } from "@/components/practice/minimal-pair-lab";
import { PracticeRouteShell } from "@/components/practice/practice-route-shell";

function PronunciationContent() {
  const params = useSearchParams();
  const contrast = params.get("contrast");
  return <MinimalPairLab key={`mp-${contrast ?? ""}`} initialContrastId={contrast ?? undefined} />;
}

export default function PronunciationPage() {
  return (
    <PracticeRouteShell title="Pronunciation">
      {() => (
        <Suspense fallback={null}>
          <PronunciationContent />
        </Suspense>
      )}
    </PracticeRouteShell>
  );
}
