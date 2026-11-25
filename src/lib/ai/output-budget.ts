/**
 * Tope de salida para el motor local (#323).
 *
 * LiteRT no expone un máximo de tokens por mensaje en la API que usamos, y el
 * adaptador ni siquiera le pasaba `maxTokens`: en local ningún tope del puerto
 * se respetaba. Se aproxima en caracteres (inglés ≈ 4 caracteres por token) y
 * el bucle de streaming corta y cancela al alcanzarlo.
 */
export const CHARS_PER_TOKEN = 4;

export function outputBudgetReached(text: string, maxTokens: number | undefined): boolean {
  if (maxTokens === undefined || !Number.isFinite(maxTokens) || maxTokens <= 0) return false;
  return text.length >= maxTokens * CHARS_PER_TOKEN;
}

/**
 * Llamadas cuyo tope SÍ se aplica en local. Los demás presupuestos del puerto
 * (lección, enseñar, fonética, traducción…) nunca se aplicaron —ni en local ni
 * en la nube— y no están calibrados: aplicarlos podría cortar un JSON a la
 * mitad. Se suman acá sólo después de medir su salida real.
 */
export const ENFORCED_TAGS: ReadonlySet<string> = new Set(["chat", "chat-retry", "chat-restate", "observe", "prewarm"]);

export function enforcedMaxTokens(tag: string | undefined, maxTokens: number | undefined): number | undefined {
  return tag !== undefined && ENFORCED_TAGS.has(tag) ? maxTokens : undefined;
}
