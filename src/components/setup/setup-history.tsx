/** Historial del chequeo (FR-035): últimas corridas con origen y ms por sonda. */
import type { SetupCheckRecord } from "@/domain/setup/setup-check-record";

const TRIGGER_LABEL: Record<SetupCheckRecord["trigger"], string> = {
  "first-run": "First run", settings: "Manual", "live-failure": "After a failure",
};
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
              {PROBE_LABEL[p.probe]} {p.ms !== undefined ? `${p.ms} ms` : "n/a"}
            </span>
          ))}
        </li>
      ))}
    </ul>
  );
}
