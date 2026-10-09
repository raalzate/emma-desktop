/**
 * Racha diaria (#216, FR-003): días calendario consecutivos con práctica. Los
 * días son enteros (días desde epoch en hora local, los calcula el borde): el
 * dominio no conoce `Date`. Hoy sin practicar todavía no rompe la racha si ayer
 * sí se practicó — se rompe recién mañana.
 */

export interface DailyStreak {
  current: number;
  best: number;
  activeToday: boolean;
}

/** Longitud de la corrida de días consecutivos que termina en `end`. */
function runEndingAt(days: ReadonlySet<number>, end: number): number {
  let length = 0;
  while (days.has(end - length)) length += 1;
  return length;
}

function bestRun(sorted: readonly number[]): number {
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    run = i > 0 && sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export function streakFrom(activeDays: readonly number[], today: number): DailyStreak {
  // Un día futuro (reloj adelantado o editado) no cuenta.
  const days = new Set(activeDays.filter((d) => d <= today));
  const activeToday = days.has(today);
  const current = runEndingAt(days, activeToday ? today : today - 1);
  const best = bestRun([...days].sort((a, b) => a - b));
  return { current, best, activeToday };
}
