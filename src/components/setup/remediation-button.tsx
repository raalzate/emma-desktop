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

type DialogKind = "cloud" | "models" | null;

export function RemediationButton({
  remediation, onRetest, onSwitchToLocal, onOpenSettingsTab, onCloudReady, disabled, initiallyOpen = false,
}: RemediationButtonProps) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [stepsOpen, setStepsOpen] = useState(initiallyOpen);
  const { action, label, tooltipEs } = remediation;

  const run = () => {
    switch (action.kind) {
      case "open-cloud-setup": return setDialog("cloud");
      case "open-model-manager": return setDialog("models");
      case "switch-to-local": return onSwitchToLocal();
      case "retest": return onRetest(action.probe);
      case "open-settings-tab": return onOpenSettingsTab(action.tab);
      case "steps": return setStepsOpen((v) => !v);
    }
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
            <DialogTitle>{dialog === "cloud" ? "Use cloud AI" : "Local models"}</DialogTitle>
            <DialogDescription>
              {dialog === "cloud" ? "Connect a cloud model to keep practicing." : "Download or pick a local model."}
            </DialogDescription>
          </DialogHeader>
          {dialog === "cloud" && <CloudQuickSetup recommended={false} onReady={handleReady} />}
          {dialog === "models" && <ModelManager />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
