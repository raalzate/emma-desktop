"use client";

/**
 * Ejecuta una remediación del catálogo (FR-030): abre CloudQuickSetup o
 * ModelManager en un Dialog, delega switch-to-local / retest / ajustes al padre,
 * o despliega los pasos por SO. Sólo presentación: todo entra por props.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CloudQuickSetup } from "@/components/settings/cloud-quick-setup";
import { ModelManager } from "@/components/settings/model-manager";
import type { ProbeName } from "@/domain/setup/setup-probe-result";
import type { Remediation } from "@/domain/setup/setup-remediation";
import { getEmmaApi } from "@/components/settings/emma-api";
import { loadAiSettings, saveAiSettings } from "@/lib/ai/remote-settings";

export interface RemediationButtonProps {
  remediation: Remediation;
  onRetest: (probe: ProbeName) => void;
  onSwitchToLocal: () => void;
  onOpenSettingsTab: (tab: "remote" | "local") => void;
  /** Se llama al guardar la llave de nube desde el diálogo (el padre repite la prueba). */
  onCloudReady: () => void;
  disabled?: boolean;
  /** Sólo para pruebas: abre los pasos de entrada. */
  initiallyOpen?: boolean;
}

type DialogKind = "cloud" | "cloud-replies" | "models" | null;

export function RemediationButton({
  remediation, onRetest, onSwitchToLocal, onOpenSettingsTab, onCloudReady, disabled, initiallyOpen = false,
}: RemediationButtonProps) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [stepsOpen, setStepsOpen] = useState(initiallyOpen);
  const { action, label, tooltipEs } = remediation;

  const run = () => {
    switch (action.kind) {
      case "open-cloud-setup": return setDialog("cloud");
      case "reply-in-cloud": return void enableReplyInCloud();
      case "open-model-manager": return setDialog("models");
      case "switch-to-local": return onSwitchToLocal();
      case "retest": return onRetest(action.probe);
      case "open-settings-tab": return onOpenSettingsTab(action.tab);
      case "steps": return setStepsOpen((v) => !v);
    }
  };

  // #348: con llave ya guardada se activa sin pedir nada; si no, la
  // configuración rápida guarda la llave en modo «sólo respuestas».
  const enableReplyInCloud = async () => {
    const keys = ((await getEmmaApi()?.getAiKeyStatus()) ?? {}) as Record<string, boolean>;
    const settings = loadAiSettings();
    if (keys[settings.provider]) {
      saveAiSettings({ ...settings, replyInCloud: true });
      onCloudReady();
      return;
    }
    setDialog("cloud-replies");
  };

  const handleReady = () => {
    setDialog(null);
    onCloudReady();
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        title={tooltipEs}
        disabled={disabled}
        onClick={run}
        {...(action.kind === "steps" ? { "aria-expanded": stepsOpen } : {})}
      >
        {label}
      </Button>
      {action.kind === "steps" && stepsOpen && (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {action.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
      )}
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog === "models" ? "Local models" : "Use cloud AI"}</DialogTitle>
            <DialogDescription>
              {dialog === "models" ? "Download or pick a local model." : "Connect a cloud model to keep practicing."}
            </DialogDescription>
          </DialogHeader>
          {dialog === "cloud" && <CloudQuickSetup recommended={false} onReady={handleReady} />}
          {dialog === "cloud-replies" && <CloudQuickSetup recommended={false} onReady={handleReady} scope="replies" />}
          {dialog === "models" && <ModelManager />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
