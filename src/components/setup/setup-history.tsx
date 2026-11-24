/** Historial del chequeo (FR-035): últimas corridas con origen y ms por sonda. */
import type { SetupCheckRecord } from "@/domain/setup/setup-check-record";
import { firstLoadLabel } from "./setup-check-state";

const TRIGGER_LABEL: Record<SetupCheckRecord["trigger"], string> = {
  "first-run": "First run", settings: "Manual", "live-failure": "After a failure",
};

/** Motor de voz y contexto de la IA que se midieron (sin audio ni prompts). */
function contextOf(m: SetupCheckRecord["measurements"]): string[] {
  const parts: string[] = [];
  if (m?.voiceEngine) parts.push(`voice: ${m.voiceEngine}`);
  if (m?.ai) {
    parts.push(`AI: ${m.ai.mode}, ${m.ai.online ? "online" : "offline"}`);
    if (m.ai.loadMs !== undefined) parts.push(firstLoadLabel(m.ai.loadMs));
  }
  return parts;
}
type ProbeEntry = SetupCheckRecord["diagnosis"]["probes"][number];

/** El micrófono no mide ms: se muestra su estado, deducido de la severidad y las causas. */
function micState(p: ProbeEntry): string {
  if (p.severity === "ok") return "granted";
  if (p.causes.includes("mic-denied")) return "denied";
  if (p.causes.includes("mic-missing")) return "no device";
  return "timed out";
}

const probeDetail = (p: ProbeEntry): string =>
  p.probe === "mic" ? micState(p) : p.ms !== undefined ? `${p.ms} ms` : "n/a";
const PROBE_LABEL = { voice: "Voice", ai: "AI", mic: "Mic" } as const;
const VERDICT_LABEL = { pass: "All good", warn: "Warnings", blocked: "Blocked" } as const;

export function SetupHistory({ records }: { records: readonly SetupCheckRecord[] }) {
  if (records.length === 0) return <p className="text-sm text-muted-foreground">No checks yet.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {records.map((r) => (
        <li key={r.at} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium">{TRIGGER_LABEL[r.trigger]}</span>
          <span>{VERDICT_LABEL[r.diagnosis.verdict]}</span>
          <time className="text-xs text-muted-foreground" dateTime={new Date(r.at).toISOString()}>
            {new Date(r.at).toLocaleString("en-US")}
          </time>
          {r.diagnosis.probes.map((p) => (
            <span key={p.probe} className="font-code text-xs text-muted-foreground">
              {PROBE_LABEL[p.probe]} {probeDetail(p)}
            </span>
          ))}
          {contextOf(r.measurements).map((c) => (
            <span key={c} className="font-code text-xs text-muted-foreground">{c}</span>
          ))}
        </li>
      ))}
    </ul>
  );
}
