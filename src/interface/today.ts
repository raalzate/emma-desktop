/**
 * "Hoy" como días enteros desde epoch: la unidad de tiempo del dominio
 * Leitner (que no conoce `Date`). Único lugar del renderer que lo calcula.
 */

const MS_PER_DAY = 86_400_000;

export function todayAsDays(): number {
  return Math.floor(Date.now() / MS_PER_DAY);
}

/**
 * "Hoy" en días enteros según el reloj LOCAL: la racha diaria (#216) cuenta
 * días del aprendiz, no de UTC — practicar a las 21 h en UTC−5 es el mismo día.
 */
export function localTodayAsDays(now: Date = new Date()): number {
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / MS_PER_DAY);
}
