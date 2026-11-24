/**
 * Historial del chequeo de setup sobre el almacén JSON (clave "setupChecks").
 * Guard clauses al leer: un registro corrupto se descarta en vez de lanzar.
 * Sólo mediciones y diagnósticos: nunca audio ni prompts (FR-035).
 */

import type { ISetupCheckRepository } from "@/domain/setup/i-setup-check-repository";
import { appendHistory, type SetupCheckRecord } from "@/domain/setup/setup-check-record";
import { readOne, writeOne } from "./store-client";

const KEY = "setupChecks";

interface SetupChecksDoc {
  records: SetupCheckRecord[];
}

function isRecord(value: unknown): value is SetupCheckRecord {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  const d = r.diagnosis as Record<string, unknown> | null | undefined;
  return (
    typeof r.version === "number" &&
    typeof r.at === "number" &&
    typeof r.trigger === "string" &&
    typeof r.acknowledged === "boolean" &&
    typeof d === "object" &&
    d !== null &&
    typeof d.verdict === "string" &&
    Array.isArray(d.probes)
  );
}

async function loadRecords(): Promise<SetupCheckRecord[]> {
  const stored = await readOne<{ records?: unknown }>(KEY);
  return Array.isArray(stored?.records) ? stored.records.filter(isRecord) : [];
}

const save = (records: SetupCheckRecord[]) => writeOne<SetupChecksDoc>(KEY, { records });

export function createSetupCheckRepository(): ISetupCheckRepository {
  return {
    async last() {
      return (await loadRecords())[0] ?? null;
    },
    history: loadRecords,
    async append(record) {
      await save(appendHistory(await loadRecords(), record));
    },
    async acknowledgeLast() {
      const [latest, ...rest] = await loadRecords();
      if (!latest) return null;
      const acknowledged = { ...latest, acknowledged: true };
      await save([acknowledged, ...rest]);
      return acknowledged;
    },
  };
}
