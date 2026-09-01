/**
 * Memoria de trabajo de la escena: lo CONCRETO que ya está en juego.
 *
 * El "why": el turno viajaba con la transcripción entera y nada más, así que
 * los detalles inventados (un ticket, un nombre, un día) se diluían en cuanto
 * la conversación crecía y el personaje los reinventaba a mitad de escena. Un
 * puñado de entidades en una línea fija esos detalles por mucho menos contexto
 * que arrastrar todos los turnos, que es lo que hacía crecer el prompt sin
 * techo. Dominio puro: sólo texto.
 */

import type { ChatTurn } from "./simulation-session";

/** Tope de entidades en el prompt: pasado esto, el bloque estorba más que ayuda. */
const MAX_ENTITIES = 8;

/** Identificadores de ticket/proyecto: "PROJ-421", "AB-7". */
const TICKET = /\b[A-Z][A-Z0-9]{1,9}-\d+\b/g;

/**
 * Nombre propio que NO abre la oración. La restricción es lo que hace fiable la
 * heurística: en inglés toda oración empieza en mayúscula, así que la primera
 * palabra no dice nada sobre si es un nombre.
 */
const INNER_PROPER_NOUN = /(?<=[a-z,]\s)\b[A-Z][a-z]{2,}\b/g;

/** Palabras que empiezan en mayúscula sin ser entidades de la escena. */
const NOT_AN_ENTITY = new Set([
  "I", "English", "Spanish", "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday", "Yesterday", "Today", "Tomorrow",
]);

export interface SceneMemory {
  /** Detalles concretos ya nombrados (tickets, personas), del más viejo al más nuevo. */
  entities: string[];
  /** Pregunta que la persona dejó sin responder en su último turno. */
  openQuestion: string | null;
}

/** Entidades concretas nombradas en la conversación, sin repetir y acotadas. */
export function sceneEntities(history: readonly ChatTurn[]): string[] {
  const found: string[] = [];
  for (const turn of history) {
    const matches = [
      ...(turn.content.match(TICKET) ?? []),
      ...(turn.content.match(INNER_PROPER_NOUN) ?? []),
    ];
    for (const match of matches) {
      if (NOT_AN_ENTITY.has(match) || found.includes(match)) continue;
      found.push(match);
    }
  }
  // Se recortan las MÁS VIEJAS: lo que se acaba de nombrar es lo que el
  // siguiente turno tiene que respetar.
  return found.slice(-MAX_ENTITIES);
}

/**
 * La pregunta con la que la persona cerró su último turno, si el turno suyo es
 * el último. Sirve para que no la olvide ni la repita cambiada.
 */
export function openQuestionOf(history: readonly ChatTurn[]): string | null {
  const last = history[history.length - 1];
  if (!last || last.role !== "assistant") return null;
  const question = last.content.trim().match(/([^.!?]*\?)\s*$/);
  return question ? question[1].trim() : null;
}

/** Construye la memoria de la escena a partir del historial. */
export function buildSceneMemory(history: readonly ChatTurn[]): SceneMemory {
  return { entities: sceneEntities(history), openQuestion: openQuestionOf(history) };
}

/** Bloque compacto para el prompt; vacío si no hay nada que recordar. */
export function renderSceneMemory(memory: SceneMemory): string {
  const lines: string[] = [];
  if (memory.entities.length > 0) {
    lines.push(
      `SCENE MEMORY — details already in play (keep them exactly): ${memory.entities.join(", ")}`,
    );
  }
  if (memory.openQuestion) {
    lines.push(`You are waiting on their answer to: "${memory.openQuestion}"`);
  }
  return lines.join("\n");
}
