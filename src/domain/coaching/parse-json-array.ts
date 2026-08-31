/**
 * Parsers tolerantes al formato del LLM pequeño: extraen el primer array JSON
 * aunque el modelo lo envuelva en comentario o texto extra. Ante cualquier
 * fallo devuelven [] (nunca lanzan) para que la UI degrade sin romper el turno.
 */

/** Aísla el primer `[...]` del texto crudo; si no hay, usa el texto recortado. */
export function extractJsonArray(raw: string): string {
  const match = raw.match(/\[[\s\S]*\]/);
  return match ? match[0] : raw.trim();
}

/** Parsea el crudo a un array sin tipar; [] si no es JSON o no es un array. */
export function parseRawArray(raw: string): unknown[] {
  let data: unknown;
  try {
    data = JSON.parse(extractJsonArray(raw));
  } catch {
    return [];
  }
  return Array.isArray(data) ? data : [];
}

/** True para strings no vacías (ya sabemos que se recortarán). */
export function isNonEmptyString(item: unknown): item is string {
  return typeof item === "string" && item.trim().length > 0;
}
