/**
 * Repositorio de stats de error sobre el almacén JSON. Guarda un batch por sesión
 * y agrega los últimos N al leer (equivalente a la tabla error_stats original).
 */

import type { IErrorStatsRepository } from "@/domain/progression/i-error-stats-repository";
import type { ErrorStat } from "@/domain/progression/error-stats";
import { readCollection, writeOne, LOCAL_USER } from "./store-client";

const KEY = "errorStats";

interface Bucket {
  sessions: ErrorStat[][];
}

async function loadBucket(): Promise<Bucket> {
  const all = await readCollection<Bucket>(KEY);
  return all[LOCAL_USER] ?? { sessions: [] };
}

/** Suma conteos por categoría sobre varias sesiones. */
function aggregate(batches: ErrorStat[][]): ErrorStat[] {
  const totals = new Map<string, number>();
  for (const batch of batches) {
    for (const stat of batch) {
      totals.set(stat.errorType, (totals.get(stat.errorType) ?? 0) + stat.count);
    }
  }
  return [...totals.keys()].sort().map((errorType) => ({ errorType, count: totals.get(errorType)! }));
}

export function createErrorStatsRepository(): IErrorStatsRepository {
  return {
    async record(_userId, stats) {
      if (!stats.length) return;
      const bucket = await loadBucket();
      bucket.sessions.push(stats);
      await writeOne(KEY, bucket);
    },
    async getRecentStats(_userId, lastNSessions) {
      const bucket = await loadBucket();
      const recent = lastNSessions ? bucket.sessions.slice(-lastNSessions) : bucket.sessions;
      return aggregate(recent);
    },
  };
}
