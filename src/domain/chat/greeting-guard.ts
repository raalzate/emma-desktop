/**
 * Guardia anti-resaludo (BUG-001): el modelo local reabre la conversación
 * ("Hello! …") en turnos intermedios como si la escena empezara de nuevo.
 * Una persona real saluda UNA vez; después de eso el saludo inicial se
 * elimina de forma determinista. Dominio puro: solo texto.
 *
 * Con una excepción que costó naturalidad: si el APRENDIZ acaba de saludar,
 * borrar el saludo de vuelta dejaba a la persona ignorando un "hi, good
 * morning" y respondiendo con una pregunta a secas. Nadie hace eso.
 */

const LEADING_GREETING =
  /^(?:hey|hi(?: there)?|hello(?: there)?|good\s+(?:morning|afternoon|evening)|morning)\b[^.!?…]*[.!?…]?\s*/i;

/** El mensaje ARRANCA con un saludo (lo que dice el aprendiz al abrir un turno). */
const OPENING_GREETING =
  /^\s*(?:hey|hi|hello|good\s+(?:morning|afternoon|evening)|morning|afternoon|evening)\b/i;

/** Máximo de oraciones de saludo encadenadas a extirpar ("Hello! Good morning!"). */
const MAX_GREETING_SENTENCES = 2;

/** ¿El mensaje del aprendiz empieza saludando? */
export function isGreeting(message: string): boolean {
  return OPENING_GREETING.test(message);
}

interface Options {
  /** El aprendiz saludó en el turno que se está respondiendo: se le devuelve el saludo. */
  learnerGreeted?: boolean;
}

/**
 * Si la persona ya abrió la escena (`alreadyGreeted`), elimina el saludo con el
 * que empiece `text`. Si toda la respuesta era saludo devuelve cadena vacía:
 * el caller decide el reemplazo en personaje.
 */
export function stripRepeatedGreeting(
  text: string,
  alreadyGreeted: boolean,
  options: Options = {},
): string {
  if (!alreadyGreeted || options.learnerGreeted) return text;
  let out = text.trimStart();
  for (let i = 0; i < MAX_GREETING_SENTENCES && LEADING_GREETING.test(out); i++) {
    out = out.replace(LEADING_GREETING, "").trimStart();
  }
  return out.trim();
}
