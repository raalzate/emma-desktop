/** Conteos de error por categoría y derivación de la categoría recurrente (puro). */

import type { SilentError } from "@/domain/chat/silent-error";

export const DEFAULT_MIN_TOTAL = 3;

/** Ocurrencias sumadas de una categoría de error. */
export interface ErrorStat {
  errorType: string;
  count: number;
}

/** Construye un ErrorStat validando que el conteo sea positivo. */
export function createErrorStat(errorType: string, count: number): ErrorStat {
  if (count <= 0) throw new Error(`count must be positive, got ${count}`);
  return { errorType, count };
}

/** Colapsa el buffer de errores silenciosos de una sesión en conteos por categoría. */
export function statsFromErrors(errors: SilentError[]): ErrorStat[] {
  const counts = new Map<string, number>();
  for (const error of errors) {
    counts.set(error.label, (counts.get(error.label) ?? 0) + 1);
  }
  // sorted(counts.items()) — orden alfabético por categoría.
  const keys = [...counts.keys()].sort();
  return keys.map((errorType) => createErrorStat(errorType, counts.get(errorType)!));
}

/** Categoría más frecuente sólo si su suma alcanza *minTotal*; empates alfabéticos. */
export function recurringCategory(
  stats: ErrorStat[],
  minTotal: number = DEFAULT_MIN_TOTAL,
): string | null {
  const totals = new Map<string, number>();
  for (const stat of stats) {
    totals.set(stat.errorType, (totals.get(stat.errorType) ?? 0) + stat.count);
  }
  if (totals.size === 0) return null;
  // max(sorted(totals), key=...) — empates resueltos por orden alfabético.
  const keys = [...totals.keys()].sort();
  const winner = keys.reduce((best, k) => (totals.get(k)! > totals.get(best)! ? k : best));
  return totals.get(winner)! >= minTotal ? winner : null;
}
