/**
 * Tiempos del tecleo de la narración (dominio puro).
 *
 * El "why": el efecto máquina de escribir se implementaba con un contador que
 * sumaba una letra por tick, así que la velocidad real dependía del scheduler
 * del navegador y un tab en segundo plano se desincronizaba. Aquí el revelado
 * es función del tiempo transcurrido: cualquier frame perdido se recupera solo.
 */

/** Velocidad de lectura cómoda para texto en inglés de un aprendiz. */
export const DEFAULT_CHARS_PER_SECOND = 45;

/** Pausa entre un compás de narración y el siguiente (deja respirar la escena). */
export const BEAT_PAUSE_MS = 420;

/** Cuántos caracteres van revelados de `total` tras `elapsedMs` a esa velocidad. */
export function revealedChars(elapsedMs: number, total: number, charsPerSecond: number): number {
  if (total <= 0) return 0;
  if (elapsedMs <= 0) return 0;
  if (charsPerSecond <= 0) return total;
  const revealed = Math.floor((elapsedMs * charsPerSecond) / 1000);
  return Math.min(total, revealed);
}

/** Cuánto tarda en teclearse un texto completo, en milisegundos. */
export function typingDurationMs(text: string, charsPerSecond: number): number {
  if (charsPerSecond <= 0) return 0;
  return Math.ceil((text.length * 1000) / charsPerSecond);
}
