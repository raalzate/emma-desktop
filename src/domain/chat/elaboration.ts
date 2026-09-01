/**
 * ¿La respuesta del aprendiz merece que la persona pida un detalle más?
 *
 * El "why": la escena avanzaba con respuestas de una línea, muy por debajo del
 * "monólogo sostenido" que el método mide como progreso. Pedir un detalle
 * concreto en personaje fuerza producción extendida sin sermonear. El umbral
 * escala con el nivel MCER: a un A1 una frase ya es logro; a un B2 no.
 *
 * Dominio puro: cuenta palabras de contenido y devuelve texto de directiva.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { contentWordCount, isClosedNegative } from "./scene-state";

/**
 * Palabras de contenido esperadas antes de dar la respuesta por desarrollada.
 *
 * Calibrado sobre `contentWordCount`, que descuenta el léxico funcional: "I
 * finished the report for the client" son 7 palabras pero solo 3 de contenido.
 * Con umbrales altos se pedía detalle de respuestas completas y correctas, que
 * es justo lo contrario de lo que se busca.
 */
const MIN_CONTENT_WORDS: Record<CefrLevel, number> = {
  A1: 2,
  A2: 3,
  B1: 5,
  B2: 6,
  C1: 7,
};

/**
 * Respuestas cerradas legítimas: perseguir un "no blockers" suena a
 * interrogatorio. Las negaciones escuetas (incluidas las mal escritas) las
 * reconoce `isClosedNegative`, que es la MISMA noción que usa el checklist —
 * tenerla duplicada aquí significaba que sólo se arreglaba una de las dos.
 */
const CLOSED_ANSWER =
  /\bno blockers?\b|\bnothing (?:is )?block|\bnot really\b|\ball good\b|\bno issues?\b/i;

/** Umbral inferior: por debajo es relleno, y de eso ya se ocupa el checklist. */
const FILLER_FLOOR = 2;

export function needsElaboration(message: string, level: CefrLevel): boolean {
  if (CLOSED_ANSWER.test(message) || isClosedNegative(message)) return false;
  const words = contentWordCount(message);
  return words >= FILLER_FLOOR && words < MIN_CONTENT_WORDS[level];
}

/**
 * Directiva: un detalle concreto sobre lo mismo, sin cambiar de tema.
 *
 * Escrita como lo que la PERSONA quiere, con un ejemplo de línea hablada. La
 * versión anterior describía el acto de habla en jerga de asistente («ask ONE
 * specific follow-up for a concrete detail») y el modelo devolvía esa misma
 * jerga: «I'd like to know more about the specific technical challenge you are
 * facing». Mostrar la línea funciona donde prohibir no llegaba.
 */
export function buildElaborationCue(): string {
  return (
    "They kept it short and you are curious about that same thing. Say one " +
    'short line that asks for the concrete bit — like "Nice, which part took ' +
    'you the longest?" Stay on their topic; do not open a new one.'
  );
}
