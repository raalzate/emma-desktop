/**
 * Recast: devolver la forma correcta dentro de la respuesta de la persona.
 *
 * El "why": la corrección silenciosa se entrega al final de la sesión, lejos del
 * momento en que se produjo el error. La práctica deliberada exige feedback
 * inmediato (Ericsson), y en conversación el vehículo que no rompe la inmersión
 * es la reformulación natural (recast, Long): el interlocutor repite la idea bien
 * dicha como si fueran sus propias palabras, sin señalar la falta ni cambiar de
 * idioma (Artículo 9). Dominio puro: produce texto de directiva, no llama a nada.
 */

import { isActionableCorrection, type SilentError } from "./silent-error";

/**
 * Directiva de recast para el turno actual a partir de los errores capturados.
 * Usa la corrección REAL más reciente; cadena vacía si no hay ninguna.
 */
export function buildRecastCue(errors: readonly SilentError[]): string {
  const usable = errors.filter(isActionableCorrection);
  const latest = usable[usable.length - 1];
  if (!latest) return "";
  return (
    `RECAST — their last line had a slip. Work this corrected phrasing into your ` +
    `own reply as if you were echoing their point back ("so you're …", "right, ` +
    `you …"), naturally and in character. NEVER mention grammar, never correct ` +
    `them explicitly, never switch language. Correct phrasing: "${latest.corrected.trim()}"`
  );
}
