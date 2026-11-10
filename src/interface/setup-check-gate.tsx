"use client";

/**
 * Compuerta de primer arranque (FR-031..FR-033): antes del onboarding corre el
 * chequeo de voz, IA y micrófono. Vive DENTRO de AiGate (siempre hay un motor que
 * probar) y devuelve null hasta que el runtime esté listo, para no montar el
 * onboarding ni calentar la voz mientras la sonda mide. Tras Continue no vuelve.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { SetupCheckReport } from "@/components/setup/setup-check-report";
import { useSetupCheck } from "@/components/setup/use-setup-check";
import { loadAiSettings, saveAiSettings } from "@/lib/ai/remote-settings";
import { useEmma } from "./emma-context";
import { gateView } from "./setup-gate-state";

function FirstRunCheck({ onDismiss }: { onDismiss: () => void }) {
  const { runtime } = useEmma();
  const setup = runtime?.setup ?? null;
  const check = useSetupCheck(setup, "first-run");
  const { runAll, retest } = check;

  useEffect(() => {
    void runAll();
  }, [runAll]);

  const proceed = async () => {
    try {
      await setup?.acknowledge();
    } finally {
      onDismiss();
    }
  };

  const switchToLocal = () => {
    saveAiSettings({ ...loadAiSettings(), mode: "local" });
    void retest("ai");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <SetupCheckReport
        diagnosis={check.diagnosis}
        running={check.running}
        retesting={check.retesting}
        onContinue={() => void proceed()}
        onContinueAnyway={() => void proceed()}
        onRunAgain={() => void runAll()}
        onRetest={(p) => void retest(p)}
        onSwitchToLocal={switchToLocal}
        // Con la app bloqueada no hay ajustes a los que ir: los diálogos de remediación cubren esos casos.
        onOpenSettingsTab={() => {}}
        onCloudReady={() => void runAll()}
      />
    </main>
  );
}

export function SetupCheckGate({ children }: { children: ReactNode }) {
  const { ready, runtime, profile } = useEmma();
  const [needsCheck, setNeedsCheck] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const completed = profile?.onboardingState === "completed";
  useEffect(() => {
    if (!ready || !runtime) return;
    let alive = true;
    void runtime.setup.needsFirstRun(completed).then((n) => alive && setNeedsCheck(n));
    return () => { alive = false; };
  }, [ready, runtime, completed]);

  const onDismiss = useCallback(() => setDismissed(true), []);
  const view = gateView({ ready, needsCheck, dismissed });
  if (view === "wait") return null;
  if (view === "check") return <FirstRunCheck onDismiss={onDismiss} />;
  return <>{children}</>;
}
