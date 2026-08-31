/**
 * Guardia anti-resaludo (BUG-001): el modelo local reabre la conversación
 * ("Hello! …") en turnos intermedios como si la escena empezara de nuevo.
 * Una persona real saluda UNA vez; después de eso el saludo inicial se
 * elimina de forma determinista. Dominio puro: solo texto.
 */

const LEADING_GREETING =
  /^(?:hey|hi(?: there)?|hello(?: there)?|good\s+(?:morning|afternoon|evening)|morning)\b[^.!?…]*[.!?…]?\s*/i;

/** Máximo de oraciones de saludo encadenadas a extirpar ("Hello! Good morning!"). */
const MAX_GREETING_SENTENCES = 2;

/**
 * Si la persona ya abrió la escena (`alreadyGreeted`), elimina el saludo con el
 * que empiece `text`. Si toda la respuesta era saludo devuelve cadena vacía:
 * el caller decide el reemplazo en personaje.
 */
export function stripRepeatedGreeting(text: string, alreadyGreeted: boolean): string {
  if (!alreadyGreeted) return text;
  let out = text.trimStart();
  for (let i = 0; i < MAX_GREETING_SENTENCES && LEADING_GREETING.test(out); i++) {
    out = out.replace(LEADING_GREETING, "").trimStart();
  }
  return out.trim();
}
