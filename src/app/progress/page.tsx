"use client";

/**
 * Ruta "Mi progreso": mapa CEFR del aprendiz. Espera al runtime, redirige al
 * onboarding si falta el perfil y delega el render a <ProgressView/>.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmma } from "@/interface/emma-context";
import { AppShell } from "@/components/nav/app-shell";
import { ProgressView } from "@/components/progress/progress-view";
import { ProgressSkeleton } from "@/components/progress/progress-skeleton";
import { PageHeader } from "@/components/nav/page-header";

export default function ProgressPage() {
  const { runtime, profile, ready } = useEmma();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);

  if (!ready || !runtime) {
    return (
      <AppShell>
        <ProgressSkeleton />
      </AppShell>
    );
  }
  if (!profile) return null; // redirigiendo al onboarding
  return (
    <AppShell>
      <PageHeader title="Mi progreso" />
      <ProgressView runtime={runtime} level={profile.englishLevel} />
    </AppShell>
  );
}
