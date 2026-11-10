"use client";

/**
 * Chequeo bajo demanda en Ajustes (FR-034, FR-035): corre el informe completo,
 * repite una sola sonda (también la señalada por `focus` al llegar desde el toast
 * de fallo) y lista las últimas 20 corridas.
 */
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupCheckReport } from "@/components/setup/setup-check-report";
import { SetupHistory } from "@/components/setup/setup-history";
import { useSetupCheck } from "@/components/setup/use-setup-check";
import { useEmma } from "@/interface/emma-context";
import { loadAiSettings, saveAiSettings } from "@/lib/ai/remote-settings";
import type { ProbeName } from "@/domain/setup/setup-probe-result";
import type { SetupCheckRecord } from "@/domain/setup/setup-check-record";

export interface SetupCheckCardProps {
  /** Sonda a repetir al abrir (viene de `?focus=`). */
  focus?: ProbeName | null;
  onOpenTab?: (tab: "remote" | "local") => void;
}

export function SetupCheckCard({ focus = null, onOpenTab }: SetupCheckCardProps) {
  const { runtime } = useEmma();
  const setup = runtime?.setup ?? null;
  const [history, setHistory] = useState<SetupCheckRecord[]>([]);
  const refresh = useCallback(() => {
    void setup?.history().then(setHistory, () => {});
  }, [setup]);
  const check = useSetupCheck(setup, "settings", refresh);
  const { retest } = check;

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (focus) void retest(focus, "live-failure");
  }, [focus, retest]);

  const switchToLocal = () => {
    saveAiSettings({ ...loadAiSettings(), mode: "local" });
    void retest("ai");
  };

  return (
    <div className="space-y-4">
      {!check.diagnosis && !check.running && !check.retesting && (
        <Card>
          <CardHeader><CardTitle>Setup check</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Test EMMA's voice, AI and microphone to find out what could work better.
            </p>
            <Button title="Prueba la voz, la IA y el micrófono y te dice qué mejorar." onClick={() => void check.runAll()}>
              Run setup check
            </Button>
            {check.failed && <p role="alert" className="text-sm text-destructive">The check could not finish. Try again.</p>}
          </CardContent>
        </Card>
      )}
      {(check.diagnosis || check.running || check.retesting) && (
        <SetupCheckReport
          diagnosis={check.diagnosis}
          running={check.running}
          retesting={check.retesting}
          onContinue={() => {}}
          onContinueAnyway={() => {}}
          onRunAgain={() => void check.runAll()}
          onRetest={(p) => void retest(p)}
          onSwitchToLocal={switchToLocal}
          onOpenSettingsTab={(tab) => onOpenTab?.(tab)}
          onCloudReady={() => void retest("ai")}
        />
      )}
      <Card>
        <CardHeader><CardTitle>Recent checks</CardTitle></CardHeader>
        <CardContent><SetupHistory records={history} /></CardContent>
      </Card>
    </div>
  );
}
