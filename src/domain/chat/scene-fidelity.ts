/**
 * Fidelidad de escena determinista: ¿la línea de la persona cambia una hora
 * que los hechos de la escena fijaron?
 *
 * Historia: aquí vivía también el prompt y el parseo de un juez LLM de
 * fidelidad. Medido en vivo (#323), el modelo pequeño rechazó 8/9 líneas
 * correctas y cada rechazo costaba otra generación: se retiró (T6). El chequeo
 * de horas es gratis, no falla en falso con frases normales y queda como parte
 * del validador del turno. Dominio puro.
 */

import { extractTimes } from "@/domain/chat/scene-highlights";

/**
 * Deriva de horas: los hechos fijan horas y la línea menciona una que no está
 * entre ellas. Sin horas en los hechos no hay contra qué comparar.
 */
export function detectTimeDrift(reply: string, facts: string): boolean {
  const fixed = extractTimes(facts);
  if (fixed.length === 0) return false;
  return extractTimes(reply).some((t) => !fixed.includes(t));
}
