/**
 * Fidelidad de escena: ¿la línea de la persona sigue dentro de la ficción?
 *
 * Mismo patrón que turn-observation: el prompt del juez es puro, el parseo es
 * entrada externa (guard clauses) y ante cualquier duda el veredicto es «en
 * escena» (fail-open) — el juez nunca debe bloquear la conversación. Además
 * hay un chequeo determinista de horas que ahorra la llamada al LLM.
 */

import { extractTimes } from "@/domain/chat/scene-highlights";

export type FidelityIssue = "contradicts-facts" | "wrong-role" | "other-scene" | "breaks-fiction";

/** Quién respondió: el juez LLM, el chequeo de horas o el fail-open (nadie juzgó). */
export type FidelitySource = "judge" | "time-check" | "fail-open";

export interface FidelityVerdict {
  inScene: boolean;
  issue: FidelityIssue | null;
  source: FidelitySource;
}

export const ISSUES: readonly FidelityIssue[] = [
  "contradicts-facts",
  "wrong-role",
  "other-scene",
  "breaks-fiction",
];

/** Veredicto neutro: ante la duda se acepta la línea, y se declara que nadie juzgó. */
export const FAIL_OPEN: FidelityVerdict = { inScene: true, issue: null, source: "fail-open" };

/** Rechazo del chequeo determinista de horas. */
export const TIME_DRIFT: FidelityVerdict = {
  inScene: false,
  issue: "contradicts-facts",
  source: "time-check",
};

export interface FidelityPromptArgs {
  facts: string;
  personaName: string;
  personaRole: string;
  situationTitle: string;
  reply: string;
}

export function buildFidelityPrompt(args: FidelityPromptArgs): string {
  return (
    "You are a strict continuity editor for a role-play scene.\n" +
    `Scene: ${args.situationTitle}\n` +
    `SCENE FACTS (fixed, cannot change): ${args.facts}\n` +
    `The speaker is ${args.personaName}, ${args.personaRole}. They must stay in that role.\n\n` +
    `Candidate line:\n"${args.reply}"\n\n` +
    "Is the line inside the scene? It is NOT if it contradicts a fact " +
    '("contradicts-facts"), speaks as another role such as a tutor or assistant ' +
    '("wrong-role"), moves to a different scenario ("other-scene"), or breaks ' +
    'the fiction ("breaks-fiction"). Return ONLY JSON: ' +
    '{"inScene":true|false,"issue":"contradicts-facts"|"wrong-role"|"other-scene"|"breaks-fiction"|null}'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Aísla el primer objeto `{...}` del crudo (el modelo pequeño envuelve en texto). */
function extractJsonObject(raw: string): string | null {
  const match = raw.match(/\{[\s\S]*?\}/);
  return match ? match[0] : null;
}

/** Parsea el veredicto del juez; cualquier salida inválida ⇒ en escena. */
export function parseFidelity(raw: string): FidelityVerdict {
  const json = extractJsonObject(raw);
  if (!json) return FAIL_OPEN;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return FAIL_OPEN;
  }
  if (!isRecord(data) || typeof data.inScene !== "boolean") return FAIL_OPEN;
  if (data.inScene) return { inScene: true, issue: null, source: "judge" };
  const issue = ISSUES.find((i) => i === data.issue) ?? "breaks-fiction";
  return { inScene: false, issue, source: "judge" };
}

/**
 * Deriva de horas: los hechos fijan horas y la línea menciona una que no está
 * entre ellas. Sin horas en los hechos no hay contra qué comparar.
 */
export function detectTimeDrift(reply: string, facts: string): boolean {
  const fixed = extractTimes(facts);
  if (fixed.length === 0) return false;
  return extractTimes(reply).some((t) => !fixed.includes(t));
}
