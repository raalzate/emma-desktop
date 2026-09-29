"use client";

/**
 * Repaso espaciado (SRS). Antes una pestaña de /practice; ahora su propia
 * ruta (H6, #199). Sin parámetros de deep-link: la cola de repaso la decide
 * el dominio con lo que está vencido.
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SrsReview } from "@/components/practice/srs-review";
import { PracticeRouteShell } from "@/components/practice/practice-route-shell";
import type { EmmaRuntime } from "@/interface/emma-runtime";

function ReviewContent({ runtime }: { runtime: EmmaRuntime }) {
  // Sin parámetros propios; se lee la URL igual que el resto de subrutas
  // para mantener el mismo patrón de Suspense en toda /practice.
  useSearchParams();
  return <SrsReview runtime={runtime} />;
}

export default function ReviewPage() {
  return (
    <PracticeRouteShell title="Review">
      {(runtime) => (
        <Suspense fallback={null}>
          <ReviewContent runtime={runtime} />
        </Suspense>
      )}
    </PracticeRouteShell>
  );
}
