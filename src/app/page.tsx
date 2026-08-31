"use client";

/**
 * Home: la ruta de aprendizaje. Si el onboarding no está completo redirige a
 * /onboarding; si no, muestra el nivel y el trazado de escenas, desde donde se
 * entra a la conversación (/chat). Espera a que runtime y perfil estén
 * hidratados antes de decidir (evita parpadeos).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmma } from "@/interface/emma-context";
import { PathwayHome } from "@/components/progress/pathway-home";
import { ProgressSkeleton } from "@/components/progress/progress-skeleton";

export default function Home() {
  const { runtime, profile, ready } = useEmma();
  const router = useRouter();
  const completed = profile?.onboardingState === "completed";

  useEffect(() => {
    if (ready && !completed) router.replace("/onboarding/");
  }, [ready, completed, router]);

  if (!ready || !runtime || !profile) return <ProgressSkeleton />;
  if (!completed) return null;

  return <PathwayHome runtime={runtime} level={profile.englishLevel} />;
}
