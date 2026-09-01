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

export interface TurnObservation {
  /** Ítem del checklist que este mensaje contesta, o null si ninguno. */
  answersItem: string | null;
  /** El mensaje es una negación que zanja el tema ("no blockers", como sea que lo diga). */
  negative: boolean;
  intent: LearnerIntent;
  substance: Substance;
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
    '"kind":"scene|help|greeting","substance":"none|thin|full"}\n' +
    '- "answers": the topic this message answers, or "none".\n' +
    '- "negative": true if it says no / nothing / declines the topic, however phrased.\n' +
    '- "kind": "help" if they ask about English or the exercise, or write Spanish; ' +
    '"greeting" if it is ONLY a greeting; else "scene".\n' +
    `- "substance": work detail relative to a ${args.level} learner — ` +
    '"full" real detail, "thin" answers with little, "none" filler or a bare no.'
  );
}

const KIND_TO_INTENT: Record<string, LearnerIntent> = {
  scene: "in-scene",
  help: "meta",
  greeting: "greeting",
};

const SUBSTANCES: readonly Substance[] = ["none", "thin", "full"];

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
  return { answersItem, negative: data.negative, intent, substance, source: "judge" };
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
  return { answersItem, negative, intent, substance, source: "heuristics" };
}
