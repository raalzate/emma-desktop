"use client";

/**
 * Pantalla de onboarding conversacional. Al montar (con el runtime listo) crea
 * un OnboardingIo respaldado por React y lo pasa a `runtime.runOnboarding`. La
 * transcripción se pinta arriba (Emma a la izquierda, usuario a la derecha) y el
 * composer queda anclado abajo, deshabilitado mientras Emma "piensa". Al
 * completar, refresca el perfil y navega a la raíz.
 */

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmma } from "@/interface/emma-context";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { OnboardingBubble, EmmaAvatar } from "@/components/onboarding/onboarding-bubble";
import { OnboardingComposer } from "@/components/onboarding/onboarding-composer";
import { useOnboardingFlow } from "@/components/onboarding/use-onboarding-flow";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingPage() {
  const { runtime, ready, refreshProfile } = useEmma();
  const router = useRouter();

  // Al completar solo refrescamos el perfil: la navegación la decide el
  // usuario con el botón de cierre (el salto automático se sentía brusco).
  const onComplete = useCallback(async () => {
    await refreshProfile();
  }, [refreshProfile]);

  const flow = useOnboardingFlow(runtime, ready, onComplete);
  const scrollRef = useAutoScroll(flow.messages.length + (flow.thinking ? 1 : 0));

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <OnboardingHeader />
      <ProgressBar value={flow.progress} total={flow.total} />
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-card p-4"
      >
        {flow.messages.map((m) => (
          <OnboardingBubble key={m.id} role={m.role} text={m.text} />
        ))}
        {flow.thinking && <ThinkingBubble />}
      </div>
      {flow.done ? (
        <div className="space-y-2 pb-2 text-center duration-500 animate-in fade-in slide-in-from-bottom-2">
          <Button size="lg" className="gap-2 px-8" onClick={() => router.push("/")}>
            Ver mi primera escena
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Te mostraré el escenario antes de empezar a conversar.
          </p>
        </div>
      ) : (
        <OnboardingComposer disabled={flow.thinking} onSend={flow.submit} />
      )}
    </main>
  );
}

/**
 * Progreso sutil: barra fina sin contador numérico — un "x / N" delata
 * estructura de formulario y rompe la sensación de charla (spec 001, US4).
 */
function ProgressBar({ value, total }: { value: number; total: number }) {
  return <Progress value={(value / total) * 100} className="h-1" />;
}

/** Indicador de "Emma está escribiendo". */
function ThinkingBubble() {
  return (
    <div className="flex items-center gap-2">
      <EmmaAvatar />
      <Skeleton className="h-8 w-32 rounded-2xl" />
    </div>
  );
}

/** Auto-scroll al final de la transcripción cuando llega un mensaje nuevo. */
function useAutoScroll(dep: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dep]);
  return ref;
}
