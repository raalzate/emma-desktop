"use client";

/**
 * Puerta de IA: EMMA no puede conversar sin un motor. Si no hay modelo local
 * descargado (ni nube configurada), muestra la pantalla de descarga en lugar de
 * dejar que la UI dispare llamadas al LLM que fallarían. Revisa el estado al
 * montar y tras cada intento; cuando la IA está lista, renderiza la app.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelManager } from "@/components/settings/model-manager";
import { checkAiReadiness } from "@/lib/ai/ai-readiness";

export function AiGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState<boolean | null>(null);

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

  // Mientras no esté lista, repasa por si una descarga termina en segundo plano.
  useEffect(() => {
    if (ready) return;
    const t = setInterval(() => void recheck(), 4000);
    return () => clearInterval(t);
  }, [ready, recheck]);

  if (ready === null) return null; // primer chequeo en curso
  if (ready) return <>{children}</>;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Prepara a Emma</h1>
        <p className="text-sm text-muted-foreground">
          EMMA corre 100% en tu equipo. Descarga un modelo Gemma para empezar a
          conversar; luego el onboarding y las simulaciones funcionan sin conexión.
        </p>
      </header>
      <ModelManager />
      <Button variant="secondary" onClick={() => void recheck()} className="mx-auto gap-2">
        <RefreshCw className="h-4 w-4" /> Ya lo descargué, continuar
      </Button>
    </main>
  );
}
