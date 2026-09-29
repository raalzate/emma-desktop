/**
 * Observación del turno: qué hizo el aprendiz con su mensaje, juzgado por el
 * MODELO y decidido por el código.
 *
 * El "why" (cuarta ronda del mismo incidente): el estado de la escena se
 * alimentaba de regexes — atribución, negación, intención, sustancia — y cada
 * arreglo cubría la frase de ayer y fallaba con la de mañana. «No, I am fine
 * for now.» quedó cubierta; «No, I am fine today.» volvió a perderse por UNA
 * palabra. Eso no converge: es comprensión de lenguaje hecha con listas.
 *
 * El reparto nuevo: una clasificación corta del LLM etiqueta el mensaje
 * (qué tema contesta, si es negación, si es meta, cuánta sustancia trae) y la
 * máquina de estados determinista —checklist, presupuesto, veto, memoria— sigue
 * mandando sobre TODO lo demás. La salida del modelo entra por una guarda
 * (`parseObservation`) y, si no pasa, las heurísticas viejas quedan como red
 * (`fallbackObservation`): la escena nunca depende de que el JSON salga bien.
 *
 * Dominio puro: prompts, parsing y heurísticas. La llamada vive en aplicación.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { classifyLearnerIntent, type LearnerIntent } from "./learner-intent";
import {
  advanceScene,
  isClosedNegative,
  isSubstantive,
  type SceneState,
} from "./scene-state";

/** Cuánta sustancia trae el mensaje, relativa al nivel del aprendiz. */
export type Substance = "none" | "thin" | "full";

/**
 * Veredicto de coherencia del mensaje (H3): tres preguntas de la rúbrica en
 * una sola etiqueta — ¿se entiende?, ¿responde a lo que Emma preguntó?,
 * ¿pertenece a la escena? "clear" cubre las tres; "unclear" falla la primera o
 * la segunda (no se entiende o no contesta); "off-topic" se entiende y
 * contesta ALGO, pero no pertenece a esta conversación.
 */
export type Coherence = "clear" | "unclear" | "off-topic";

export interface TurnObservation {
  /** Ítem del checklist que este mensaje contesta, o null si ninguno. */
  answersItem: string | null;
  /** El mensaje es una negación que zanja el tema ("no blockers", como sea que lo diga). */
  negative: boolean;
  intent: LearnerIntent;
  substance: Substance;
  coherence: Coherence;
  /**
   * Quién etiquetó: el juez LLM o la red determinista. Observable a propósito —
   * el primer despliegue del juez falló EN SILENCIO (hacía cola detrás del
   * chequeo gramatical en el motor serializado, vencía su tope y la red
   * respondía siempre) y desde fuera era indistinguible de que no existiera.
   */
  source: "judge" | "heuristics";
}

export interface PendingTopic {
  id: string;
  ask: string;
}

export interface ObservationPromptArgs {
  lastAgentLine: string;
  message: string;
  pending: readonly PendingTopic[];
  level: CefrLevel;
}

/** Prompt de clasificación: pequeño a propósito (una etiqueta, no una redacción). */
export function buildObservationPrompt(args: ObservationPromptArgs): string {
  const topics = args.pending.map((p) => `"${p.id}": ${p.ask}`).join("; ");
  return (
    "Label ONE learner message in a workplace English roleplay.\n" +
    `Agent asked: "${args.lastAgentLine}"\n` +
    `Learner said: "${args.message}"\n` +
    `Open topics — ${topics || "(none)"}\n` +
    'Return ONLY JSON: {"answers":"<topic id or none>","negative":true|false,' +
    '"kind":"scene|help|greeting","substance":"none|thin|full",' +
    '"coherence":"clear|unclear|off-topic"}\n' +
    '- "answers": the topic this message answers, or "none".\n' +
    '- "negative": true if it says no / nothing / declines the topic, however phrased.\n' +
    '- "kind": "help" if they ask about English or the exercise, or write Spanish; ' +
    '"greeting" if it is ONLY a greeting; else "scene".\n' +
    `- "substance": work detail relative to a ${args.level} learner — ` +
    '"full" real detail, "thin" answers with little, "none" filler or a bare no.\n' +
    '- "coherence": judge three things — is it understandable English with a clear meaning; ' +
    "does it respond to what the agent just asked; does it belong to this scene. " +
    '"clear" if yes to all; "unclear" if you cannot make sense of it or it ignores what was ' +
    'asked; "off-topic" if it is understandable but about something unrelated to this scene.'
  );
}

const KIND_TO_INTENT: Record<string, LearnerIntent> = {
  scene: "in-scene",
  help: "meta",
  greeting: "greeting",
};

const SUBSTANCES: readonly Substance[] = ["none", "thin", "full"];
const COHERENCES: readonly Coherence[] = ["clear", "unclear", "off-topic"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Aísla el primer objeto `{...}` del crudo (el modelo pequeño envuelve en texto). */
function extractJsonObject(raw: string): string | null {
  const match = raw.match(/\{[\s\S]*?\}/);
  return match ? match[0] : null;
}

/**
 * Guarda de borde: lo que devuelve el modelo es entrada externa. Un ítem
 * inventado se descarta (null = no cubrir nada), un `kind` desconocido cae a
 * escena (lo menos disruptivo) y cualquier forma rota devuelve null para que el
 * caller use el fallback determinista.
 */
export function parseObservation(raw: string, validItemIds: readonly string[]): TurnObservation | null {
  const json = extractJsonObject(raw);
  if (!json) return null;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isRecord(data)) return null;
  if (typeof data.answers !== "string" || typeof data.negative !== "boolean") return null;
  const answersItem = validItemIds.includes(data.answers) ? data.answers : null;
  const intent = KIND_TO_INTENT[String(data.kind)] ?? "in-scene";
  const substance = SUBSTANCES.includes(data.substance as Substance)
    ? (data.substance as Substance)
    : "none";
  // Guarda de borde (FR-004): un valor que no venga o que el modelo invente
  // cae a "clear" — ante la duda nunca se acusa. Saludo y meta son andamiaje
  // de la conversación, no contenido de la escena: siempre clear, aunque el
  // modelo derive y marque otra cosa.
  const rawCoherence = COHERENCES.includes(data.coherence as Coherence)
    ? (data.coherence as Coherence)
    : "clear";
  const coherence: Coherence = intent === "in-scene" ? rawCoherence : "clear";
  return { answersItem, negative: data.negative, intent, substance, coherence, source: "judge" };
}

export interface FallbackArgs {
  message: string;
  state: SceneState | null;
  lastAgentLine: string;
}

/**
 * Las heurísticas de siempre, ahora como RED: se usan cuando la clasificación
 * del modelo no llega o no pasa la guarda. Reproducen el comportamiento previo
 * (atribución por señales o por pregunta anclada, negación cerrada, intención
 * por marcadores), así que el peor caso es el statu quo, nunca algo nuevo.
 */
export function fallbackObservation(args: FallbackArgs): TurnObservation {
  const { message, state, lastAgentLine } = args;
  const intent = classifyLearnerIntent(message);
  const negative = isClosedNegative(message);
  let answersItem: string | null = null;
  if (intent === "in-scene" && state) {
    const after = advanceScene(state, message, { lastAgentLine });
    if (after.covered.length > state.covered.length) {
      answersItem = after.covered[after.covered.length - 1].id;
    }
  }
  const substance: Substance = negative ? "none" : isSubstantive(message) ? "full" : "none";
  // La red nunca juzga coherencia (FR-004): sin el modelo no hay rúbrica que
  // aplicar, y el peor caso posible es acusar en falso — así que siempre clear.
  return { answersItem, negative, intent, substance, coherence: "clear", source: "heuristics" };
}

/**
 * ¿Toca degradar "unclear" a "clear"? (FR-004: nunca dos turnos de aclaración
 * seguidos — sentirse regañado por no entender, dos veces, rompe la escena
 * más que dejar pasar una duda real). Sólo mira hacia atrás UN turno: el
 * caller decide qué cuenta como "el turno anterior pidió aclaración" a partir
 * de la directiva que de verdad se envió.
 */
export function resolveCoherence(coherence: Coherence, previousWasClarifying: boolean): Coherence {
  if (coherence === "unclear" && previousWasClarifying) return "clear";
  return coherence;
}

/**
 * Directiva EN PERSONAJE para "unclear": Emma no entendió o el mensaje no
 * contesta lo que preguntó. Nunca corrige gramática ni da clase — sólo dice,
 * con sus propias palabras, que no sigue el hilo y ofrece una salida (pedir
 * que lo repita de otra forma, o arriesgar una interpretación).
 */
export const UNCLEAR_CUE =
  "You did not really follow what they meant — their message was hard to understand or did not " +
  "answer what you just asked. Say, in your own natural words, that you're not sure you follow, " +
  'and ask them to say it another way or take a guess — like "Sorry, I\'m not sure I follow — do ' +
  'you mean...?" Do not correct their grammar and do not lecture: you are a colleague, not a teacher.';

/**
 * Directiva EN PERSONAJE para "off-topic": el mensaje se entiende, pero no
 * pertenece a esta escena. Un roce breve y amable, no un reto — y de vuelta
 * al objetivo de la conversación en la MISMA línea.
 */
export const OFF_TOPIC_CUE =
  "What they just said does not really connect to this conversation. Acknowledge it briefly and " +
  'warmly in one short clause, then steer back to the scene in the same line — like "Ha, fair ' +
  'enough — anyway, back to..." Do not lecture them and do not just ignore what they said.';
