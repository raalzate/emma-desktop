/**
 * Estado agéntico de la escena (BUG-001): el "razonamiento" del agente vive
 * aquí, en código determinista — no en el modelo pequeño. Checklist por
 * escenario: cada respuesta sustantiva del aprendiz cubre el ítem pendiente y
 * captura el HECHO dicho; la directiva del turno le dice al modelo qué ya sabe
 * (no re-preguntar) y qué falta (preguntar SOLO eso). Reemplaza al guion por
 * conteo de turnos, que avanzaba con relleno ("yeah") y nunca marcaba lo ya
 * respondido. Dominio puro.
 */

import { SCENE_CHECKLISTS } from "@/lib/scene-checklists";

export interface ChecklistItem {
  id: string;
  /** Qué debe preguntar la persona cuando este ítem está pendiente. */
  ask: string;
  /** Señales de que una respuesta de la persona re-pregunta este ítem. */
  reaskMarkers: RegExp;
  /**
   * Señales de que el mensaje del APRENDIZ contesta este ítem. Sin ellas la
   * atribución es ciega: hablar del presente consumía el ítem del pasado y la
   * persona repreguntaba lo mismo. Opcional: los ítems sin señal propia (p. ej.
   * "decide ahora") sólo se cubren por orden.
   */
  answerMarkers?: RegExp;
}

export interface SceneState {
  scenarioType: string;
  /** Ítems cubiertos con el hecho literal que dijo el aprendiz. */
  covered: { id: string; ask: string; fact: string; reaskMarkers: RegExp }[];
  /** Ítems aún pendientes, en orden. */
  pending: ChecklistItem[];
}

// Léxico de smalltalk/relleno: palabras que NO cuentan como contenido de trabajo.
const FILLER = new Set([
  "i", "am", "im", "is", "are", "was", "be", "a", "an", "the", "and", "but", "so",
  "too", "very", "you", "your", "youre", "me", "my", "we", "it", "its", "that",
  "thats", "this", "whats", "up", "of", "for", "by", "to", "with", "on", "at", "in",
  "yeah", "yes", "no", "ok", "okay", "sure", "fine", "good", "great", "nice",
  "happy", "well", "thanks", "thank", "how", "what", "about", "hello", "hi", "hey",
  "morning", "afternoon", "doing",
]);

/** Palabras del mensaje que NO son relleno/smalltalk (medida de contenido real). */
export function contentWordCount(message: string): number {
  const normalized = message.toLowerCase().replace(/['’`]/g, "");
  const words = normalized.match(/[a-záéíóúñü]+/g) ?? [];
  return words.filter((w) => !FILLER.has(w)).length;
}

/** ¿La respuesta aporta contenido de trabajo (≥2 palabras fuera del léxico de relleno)? */
export function isSubstantive(message: string): boolean {
  return contentWordCount(message) >= 2;
}

/**
 * Negación breve que zanja el tema ("Not", "No", "Nothing much").
 *
 * Cuenta como respuesta aunque no tenga contenido: el umbral de sustantividad la
 * descartaba, el objetivo seguía pendiente y la persona repreguntaba lo que el
 * aprendiz acababa de negar, contradiciéndose en la misma línea ("so you are not
 * blocked. What is the blocker…?").
 */
// La familia de "nothing" se reconoce con tolerancia a la falta de ortografía
// (`n[ao]t?[th]ing`): el aprendiz escribió «Nathing for now» y, al no matchear
// la palabra exacta, la escena la trató como una respuesta con contenido —
// llegó a proponerla como el hecho sobre el que profundizar.
const CLOSED_NEGATIVE =
  /^(?:no|not|nope|nah|none|n[ao]t?[th]ing|neither)(?:\s+(?:really|much|else|at all|for now|right now|yet|blockers?))?[.!]?$/i;

export function isClosedNegative(message: string): boolean {
  return CLOSED_NEGATIVE.test(message.trim().replace(/\s+/g, " "));
}

/** Estado inicial del checklist del escenario, o null si es de flujo libre. */
export function createSceneState(scenarioType: string): SceneState | null {
  const items = SCENE_CHECKLISTS[scenarioType];
  if (!items) return null;
  return { scenarioType, covered: [], pending: [...items] };
}

export interface AdvanceContext {
  /**
   * Última línea de la persona. Es la única evidencia de QUÉ se preguntó, y sin
   * ella un mensaje sin señales propias no puede atribuirse a nada.
   */
  lastAgentLine?: string;
}

/**
 * Observe: atribuye el mensaje del aprendiz al ítem que de verdad contesta.
 *
 * Dos evidencias, en este orden: las señales de contenido del propio mensaje
 * (mandan siempre), o —si no hay ninguna— el ítem que la persona ACABA de
 * preguntar, comprobado contra su última línea.
 *
 * El "why" (incidente): antes, sin señales, el mensaje caía al primer pendiente
 * de la cola. Como el aprendiz contesta en su orden y no en el nuestro, eso
 * asignaba «Nathing for now» al objetivo «yesterday» y «I spent most of
 * yesterday on the login API» al objetivo «blockers». Esos hechos inventados
 * viajaban al prompt bajo «You already know —»: el modelo recibía una versión
 * falsa de su propia conversación y respondía torpe, como era de esperar.
 *
 * Sin evidencia no se cubre nada. Que la escena tarde un turno más es mucho
 * más barato que mentirle al modelo sobre lo que se dijo.
 */
export function advanceScene(
  state: SceneState,
  userMessage: string,
  context: AdvanceContext = {},
): SceneState {
  if (state.pending.length === 0) return state;
  // Una negación breve zanja el objetivo igual que una respuesta con contenido.
  if (!isSubstantive(userMessage) && !isClosedNegative(userMessage)) return state;
  const index = attributionIndex(state, userMessage, context);
  if (index < 0) return state;
  const target = state.pending[index];
  return {
    ...state,
    covered: [...state.covered, { ...target, fact: userMessage.trim() }],
    pending: state.pending.filter((_, i) => i !== index),
  };
}

/** Índice del ítem que este mensaje contesta, o -1 si no hay evidencia. */
function attributionIndex(
  state: SceneState,
  userMessage: string,
  context: AdvanceContext,
): number {
  const byMarkers = state.pending.findIndex((i) => i.answerMarkers?.test(userMessage));
  if (byMarkers >= 0) return byMarkers;
  const asked = context.lastAgentLine;
  if (!asked) return -1;
  // El ítem que la persona preguntó, reconocido por sus propias señales de
  // re-pregunta. Sólo cuenta si sigue pendiente: una pregunta vieja sobre algo
  // ya cubierto no puede volver a consumir un objetivo.
  return state.pending.findIndex((i) => i.reaskMarkers.test(asked));
}

/**
 * Decide: directiva exacta del turno — qué ya se sabe (prohibido re-preguntar)
 * y qué toca preguntar; con todo cubierto, cerrar la escena o profundizar.
 *
 * La instrucción pide reaccionar a lo dicho ANTES de preguntar: pedir solo la
 * pregunta ("ask ONLY about X") producía turnos secos, sin acuse de recibo, que
 * se leen como si la persona no hubiera escuchado.
 *
 * `deepen` mantiene la escena abierta cuando el checklist se cubrió demasiado
 * pronto: se profundiza en un hecho ya contado en vez de cerrar una sesión que
 * aún no tiene turnos suficientes para evaluarse.
 */
export function sceneDirective(state: SceneState, opts?: { deepen?: boolean }): string {
  const known = state.covered
    .map((c) => `${c.id}: "${c.fact}"`)
    .join("; ");
  const knownLine = known ? `You already know — ${known}. Do NOT ask about those again. ` : "";
  const next = state.pending[0];
  if (!next) {
    if (opts?.deepen) {
      // El hecho para profundizar tiene que TENER algo que contar. Con «Nothing»
      // la orden era «pedí más detalle sobre: "Nothing"»: imposible de cumplir,
      // las dos generaciones salían basura y la escena caía en la línea de
      // recuperación ("Sorry, I lost my train of thought"). No alcanza con
      // `isSubstantive`: «Nathing for now» tiene dos palabras de contenido y la
      // pasaba. Una negación nunca es material para profundizar.
      const lastFact = [...state.covered]
        .reverse()
        .find((c) => isSubstantive(c.fact) && !isClosedNegative(c.fact))?.fact;
      if (!lastFact) {
        return (
          `${knownLine}The scene is not over. Say one short line that shows real ` +
          'interest in their day — like "How is the sprint treating you so far?"'
        );
      }
      return (
        `${knownLine}The scene is not over. You are curious about this, which they ` +
        `already told you: "${lastFact}". Say one short line asking for the concrete ` +
        'detail — like "How did that go in the end?"'
      );
    }
    return `${knownLine}All topics are covered: summarize their update in one line and close the scene in character.`;
  }
  return (
    `${knownLine}React to what they just said in one short clause — never contradict ` +
    `it — then ask ONLY about ${next.ask}.`
  );
}

/**
 * Avance visible de la escena: objetivos cubiertos sobre el total.
 *
 * El "why": el aprendiz no veía por dónde iba y el cierre aparecía de golpe;
 * mostrar el progreso hace que la escena se sienta con rumbo y final previsible.
 */
export function sceneProgress(state: SceneState | null): { done: number; total: number } | null {
  if (!state) return null;
  return { done: state.covered.length, total: state.covered.length + state.pending.length };
}

/** ¿El checklist está completo? (el agente debe cerrar y disparar el feedback) */
export function isSceneComplete(state: SceneState | null): boolean {
  return state !== null && state.pending.length === 0;
}

/**
 * Verify: ¿la respuesta de la persona re-pregunta un ítem ya cubierto?
 * (pregunta o sondeo que matchea los marcadores de un ítem cubierto).
 *
 * Excepción necesaria: la pregunta del ítem PENDIENTE manda. Los marcadores se
 * solapan con el vocabulario natural del siguiente tema ("Is anything blocking
 * you today?" contiene "today", ya cubierto), y vetarla dejaba a la persona sin
 * salida válida: dos generaciones rechazadas y la escena caía en la línea de
 * recuperación, como si hubiera perdido el hilo.
 */
export function isReaskingCovered(reply: string, state: SceneState | null): boolean {
  if (!state || state.covered.length === 0) return false;
  const probing = /\?|\bwhat\b|\btell me\b|\bneed to know\b/i.test(reply);
  if (!probing) return false;
  const next = state.pending[0];
  if (next?.reaskMarkers.test(reply)) return false;
  return state.covered.some((c) => c.reaskMarkers.test(reply));
}
