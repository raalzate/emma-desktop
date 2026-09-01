"use client";

/**
 * Conversación con Emma. Se entra desde el trazado de la ruta, que pasa la
 * escena en `?scenario=`; sin ese parámetro se abre la primera del nivel.
 * Redirige al onboarding si el perfil no está completo.
 */

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEmma } from "@/interface/emma-context";
import { AppShell } from "@/components/nav/app-shell";
import { ChatView } from "@/components/chat/chat-view";
import { Skeleton } from "@/components/ui/skeleton";

// El esqueleto de carga vive dentro del shell: la navegación no parpadea.
function Loading() {
  return (
    <AppShell>
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full max-w-md" />
        <span className="text-xs text-muted-foreground">Preparando la escena…</span>
      </div>
    </AppShell>
  );
}

function ChatRoute() {
  const { runtime, profile, settings, ready } = useEmma();
  const router = useRouter();
  const params = useSearchParams();
  const completed = profile?.onboardingState === "completed";

  useEffect(() => {
    if (ready && !completed) router.replace("/onboarding/");
  }, [ready, completed, router]);

  if (!ready || !runtime || !profile || !settings) return <Loading />;
  if (!completed) return null;

  return (
    <ChatView
      runtime={runtime}
      profile={profile}
      settings={settings}
      initialScenarioType={params.get("scenario") ?? undefined}
    />
  );
}

export default function ChatPage() {
  // `useSearchParams` exige Suspense con export estático.
  return (
    <Suspense fallback={<Loading />}>
      <ChatRoute />
    </Suspense>
  );
}
