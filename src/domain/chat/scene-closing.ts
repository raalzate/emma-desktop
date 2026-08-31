/**
 * Cuándo puede cerrarse una escena sin dejar al aprendiz colgado.
 *
 * El "why": cerrar en seco al agotar el presupuesto de turnos expulsaba al
 * aprendiz justo después de que la persona le hiciera una pregunta ("¿qué
 * intentaste?" → escena completada). Una pregunta abierta es un turno prometido:
 * si queda una, se conceden turnos de gracia; y desde el penúltimo turno se le
 * pide a la persona que cierre en personaje sin volver a preguntar, para que la
 * escena termine por decisión narrativa y no por corte abrupto. Dominio puro.
 */

/** Turnos extra que se conceden si la persona dejó una pregunta en el aire. */
export const MAX_GRACE_TURNS = 2;

/** Directiva de cierre: la persona remata la escena sin abrir nada nuevo. */
export const WRAP_UP_CUE =
  "This is the final exchange of the scene: react to their last answer, " +
  "sum it up in one line and close warmly in character. Do NOT ask any further questions.";

// Quita cierres tipográficos finales (comillas, paréntesis) antes de mirar el signo.
const TRAILING_WRAPPERS = /["'”’)\]\s]+$/;

/** ¿La respuesta termina preguntando (y por tanto espera contestación)? */
export function endsWithQuestion(reply: string): boolean {
  return reply.replace(TRAILING_WRAPPERS, "").endsWith("?");
}

/** Desde el penúltimo turno se avisa a la persona para que remate la escena. */
export function shouldWrapUp(turn: number, maxTurns: number): boolean {
  return turn >= maxTurns - 1;
}

export interface SceneCloseInput {
  /** El checklist del escenario quedó cubierto: la respuesta ya fue el cierre. */
  checklistComplete: boolean;
  turn: number;
  maxTurns: number;
  /** Última respuesta de la persona (para detectar preguntas abiertas). */
  lastReply: string;
  graceTurnsUsed: number;
  /**
   * Turnos mínimos para que la sesión pueda evaluarse (progresión). Cubrir el
   * checklist en tres turnos cerraba la escena antes de poder calificarla: el
   * aprendiz practicaba y no avanzaba de nivel.
   */
  minTurns?: number;
}

export interface SceneCloseDecision {
  close: boolean;
  /** Se concede un turno extra porque quedó una pregunta sin responder. */
  grantGrace: boolean;
  /** Hay que seguir la escena profundizando en lo ya contado, sin cerrar. */
  deepen: boolean;
}

/** Decide si la escena termina ya, se alarga un turno, profundiza o sigue su curso. */
export function resolveSceneClose(input: SceneCloseInput): SceneCloseDecision {
  const { checklistComplete, turn, maxTurns, lastReply, graceTurnsUsed, minTurns } = input;
  if (checklistComplete) {
    const tooEarlyToGrade = minTurns !== undefined && turn < minTurns && turn < maxTurns;
    return tooEarlyToGrade
      ? { close: false, grantGrace: false, deepen: true }
      : { close: true, grantGrace: false, deepen: false };
  }
  if (turn < maxTurns) return { close: false, grantGrace: false, deepen: false };
  const owesAnswer = endsWithQuestion(lastReply) && graceTurnsUsed < MAX_GRACE_TURNS;
  return owesAnswer
    ? { close: false, grantGrace: true, deepen: false }
    : { close: true, grantGrace: false, deepen: false };
}
