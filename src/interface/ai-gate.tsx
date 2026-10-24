"use client";

/**
 * Puerta de IA: EMMA no puede conversar sin un motor. Si no hay modelo local
 * descargado ni nube configurada, ofrece los dos caminos: descargar Gemma (por
 * defecto) o pegar una llave de nube. En un equipo sin WebGPU o con poca RAM la
 * nube va primero (`recommendEngine`), para que nadie quede frenado en la entrada.
 * Revisa el estado al montar y tras cada intento; con la IA lista, renderiza la app.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelManager } from "@/components/settings/model-manager";
import { CloudQuickSetup } from "@/components/settings/cloud-quick-setup";
import { checkAiReadiness } from "@/lib/ai/ai-readiness";
import { probeDevice } from "@/lib/ai/device-probe";
import { recommendEngine, type EngineRecommendation } from "@/domain/ai/engine-recommendation";

const LIMITED_REASON: Record<string, string> = {
  "no-webgpu": "This computer's graphics don't support WebGPU, which the local model needs.",
  "low-ram": "This computer has less memory than the local model needs.",
};

export function AiGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState<boolean | null>(null);
  const [advice, setAdvice] = useState<EngineRecommendation | null>(null);

  const recheck = useCallback(async () => {
    try {
      setReady((await checkAiReadiness()).ready);
    } catch {
      setReady(false);
    }
  }, []);

  useEffect(() => {
    void recheck();
  }, [recheck]);

  // La sonda sólo importa mientras la puerta está cerrada.
  useEffect(() => {
    if (ready !== false || advice) return;
    void probeDevice().then((cap) => setAdvice(recommendEngine(cap)));
  }, [ready, advice]);

  // Mientras no esté lista, repasa por si una descarga termina en segundo plano.
  useEffect(() => {
    if (ready) return;
    const t = setInterval(() => void recheck(), 4000);
    return () => clearInterval(t);
  }, [ready, recheck]);

  if (ready === null) return null; // primer chequeo en curso
  if (ready) return <>{children}</>;

  const cloudFirst = advice?.engine === "cloud";
  const cloud = <CloudQuickSetup recommended={cloudFirst} onReady={() => void recheck()} />;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Get Emma ready</h1>
        <p className="text-sm text-muted-foreground">
          By default EMMA runs 100% on your device: download a Gemma model and
          onboarding and simulations work offline. If this computer can&apos;t run
          it, use cloud AI instead.
        </p>
        {advice?.engine === "cloud" && (
          <p className="text-sm font-medium">{LIMITED_REASON[advice.reason]}</p>
        )}
      </header>
      {cloudFirst && cloud}
      <ModelManager />
      {!cloudFirst && cloud}
      <Button variant="secondary" title="Comprueba si el modelo ya está listo en tu equipo y sigue adelante" onClick={() => void recheck()} className="mx-auto gap-2">
        <RefreshCw className="h-4 w-4" /> I've downloaded it, continue
      </Button>
    </main>
  );
}
