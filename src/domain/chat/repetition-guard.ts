/**
 * Guardia anti-repetición de opener (BUG-001): el modelo local abre turnos
 * consecutivos con la misma muletilla ("Great, so far so good!…"). Una persona
 * real no se repite; si el opener coincide con el de un turno anterior de la
 * persona, se extirpa de forma determinista. Dominio puro: solo texto.
 */

const OPENER_KEY_WORDS = 4;

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?…])\s+/)[0] ?? "";
}

/** Clave de comparación: primeras N palabras normalizadas de la oración. */
function openerKey(sentence: string): string {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, OPENER_KEY_WORDS)
    .join(" ");
}

/**
 * Si la respuesta abre igual que un turno anterior de la persona, elimina ese
 * opener (hasta 2 oraciones encadenadas). Si todo era repetición devuelve
 * cadena vacía: el caller decide el reemplazo en personaje.
 */
export function stripRepeatedOpener(
  text: string,
  previousAssistantTurns: readonly string[],
): string {
  if (previousAssistantTurns.length === 0) return text;
  const seen = new Set(
    previousAssistantTurns.map((t) => openerKey(firstSentence(t))).filter(Boolean),
  );
  let out = text.trim();
  for (let i = 0; i < 2; i++) {
    const first = firstSentence(out);
    const key = openerKey(first);
    if (!key || !seen.has(key)) break;
    out = out.slice(first.length).trim();
  }
  return out;
}
