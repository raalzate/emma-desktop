"use client";

/**
 * Informe del chequeo de setup (FR-032, FR-037): estado por sonda con icono y
 * texto (no sólo color), ms y velocidad, causas y remediaciones del catálogo.
 * Presentacional: el diagnóstico y los manejadores entran por props. Los cambios
 * de estado se anuncian en una región aria-live.
 */

import { AlertTriangle, CheckCircle2, Loader2, XCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProbeDiagnosis, Severity, SetupDiagnosis } from "@/domain/setup/diagnose-setup";
import type { ProbeName } from "@/domain/setup/setup-probe-result";
import type { Speed } from "@/domain/setup/setup-thresholds";
import { RemediationButton } from "./remediation-button";
import { firstLoadLabel } from "./setup-check-state";

export interface SetupCheckReportProps {
  diagnosis: SetupDiagnosis | null;
  /** Corrida completa en curso. */
  running: boolean;
  /** Sonda que se está repitiendo sola (H5). */
  retesting?: ProbeName | null;
  onContinue: () => void;
  onContinueAnyway: () => void;
  onRunAgain: () => void;
  onRetest: (probe: ProbeName) => void;
  onSwitchToLocal: () => void;
  onOpenSettingsTab: (tab: "remote" | "local") => void;
  onCloudReady: () => void;
}

const PROBE_LABEL: Record<ProbeName, string> = { voice: "Voice", ai: "AI", mic: "Microphone" };
const SPEED_LABEL: Record<Speed, string> = { ok: "Fast", slow: "Slow", "very-slow": "Very slow" };
const SEVERITY_LABEL: Record<Severity, string> = { ok: "Working", warning: "Works, with issues", blocking: "Needs attention" };
const VERDICT_LABEL: Record<SetupDiagnosis["verdict"], string> = {
  pass: "Everything works.",
  warn: "EMMA works, but some things could be better.",
  blocked: "EMMA cannot start until this is fixed.",
};
const PROBE_ORDER: readonly ProbeName[] = ["voice", "ai", "mic"];

const SEVERITY_ICON: Record<Severity, { Icon: LucideIcon; tone: string }> = {
  ok: { Icon: CheckCircle2, tone: "text-primary" },
  warning: { Icon: AlertTriangle, tone: "text-accent" },
  blocking: { Icon: XCircle, tone: "text-destructive" },
};

function measure(p: ProbeDiagnosis): string | null {
  const load = p.loadMs !== undefined ? firstLoadLabel(p.loadMs) : null;
  const latency = p.ms === undefined ? null : p.speed ? `${p.ms} ms · ${SPEED_LABEL[p.speed]}` : `${p.ms} ms`;
  return [latency, load].filter(Boolean).join(" · ") || null;
}

type RowActions = Pick<
  SetupCheckReportProps,
  "onRetest" | "onSwitchToLocal" | "onOpenSettingsTab" | "onCloudReady"
>;

function ProbeRow({ probe, busy, actions }: { probe: ProbeDiagnosis; busy: boolean; actions: RowActions }) {
  const { Icon, tone } = SEVERITY_ICON[probe.severity];
  const ms = measure(probe);
  return (
    <li className="space-y-2 rounded-bubble bg-primary-soft p-4">
      <div className="flex flex-wrap items-center gap-2">
        {busy
          ? <Loader2 className="size-4 animate-spin" aria-hidden />
          : <Icon className={`size-4 ${tone}`} aria-hidden />}
        <span className="font-medium">{PROBE_LABEL[probe.probe]}</span>
        <span className="text-sm">{busy ? "Checking…" : SEVERITY_LABEL[probe.severity]}</span>
        {ms && !busy && <span className="font-code text-xs text-muted-foreground">{ms}</span>}
        <Button
          type="button" size="sm" variant="ghost" className="ml-auto"
          title={`Repite sólo la prueba de ${{ voice: "voz", ai: "IA", mic: "micrófono" }[probe.probe]}.`}
          disabled={busy}
          onClick={() => actions.onRetest(probe.probe)}
        >
          Test again
        </Button>
      </div>
      {probe.severity !== "ok" && <p className="text-sm text-muted-foreground">{probe.summary}</p>}
      {probe.remediations.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {probe.remediations.map((r) => (
            <RemediationButton key={r.label} remediation={r} disabled={busy} {...actions} />
          ))}
        </div>
      )}
    </li>
  );
}

function PendingRow({ probe }: { probe: ProbeName }) {
  return (
    <li className="flex items-center gap-2 rounded-bubble bg-primary-soft p-4">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="font-medium">{PROBE_LABEL[probe]}</span>
      <span className="text-sm">Checking…</span>
    </li>
  );
}

function Footer({ diagnosis, p }: { diagnosis: SetupDiagnosis; p: SetupCheckReportProps }) {
  return (
    <div className="flex flex-wrap gap-3">
      {diagnosis.verdict === "pass" && (
        <Button type="button" title="Entra a EMMA: todo funciona." onClick={p.onContinue}>Continue</Button>
      )}
      {diagnosis.verdict === "warn" && (
        <Button type="button" title="Entra a EMMA aunque haya avisos; puedes revisarlos luego en Ajustes." onClick={p.onContinueAnyway}>
          Continue anyway
        </Button>
      )}
      <Button
        type="button" variant="outline" title="Repite todas las pruebas desde cero."
        disabled={p.running || !!p.retesting} onClick={p.onRunAgain}
      >
        Run again
      </Button>
    </div>
  );
}

export function SetupCheckReport(p: SetupCheckReportProps) {
  const { diagnosis, running, retesting } = p;
  const actions: RowActions = {
    onRetest: p.onRetest, onSwitchToLocal: p.onSwitchToLocal,
    onOpenSettingsTab: p.onOpenSettingsTab, onCloudReady: p.onCloudReady,
  };
  const showRows = !running && diagnosis !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setting up EMMA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p role="status" aria-live="polite" className="text-sm">
          {running && "Checking voice, AI and microphone…"}
          {showRows && (retesting ? "Checking…" : VERDICT_LABEL[diagnosis.verdict])}
        </p>
        <ul className="space-y-3">
          {running && PROBE_ORDER.map((n) => <PendingRow key={n} probe={n} />)}
          {showRows && diagnosis.probes.map((pr) => (
            <ProbeRow key={pr.probe} probe={pr} busy={retesting === pr.probe} actions={actions} />
          ))}
        </ul>
        {showRows && <Footer diagnosis={diagnosis} p={p} />}
      </CardContent>
    </Card>
  );
}
