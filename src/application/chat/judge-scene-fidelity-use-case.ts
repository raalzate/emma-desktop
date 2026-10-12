/**
 * Caso de uso: juez de fidelidad de escena — ¿la línea de la persona sigue
 * dentro de los SCENE FACTS y de su rol?
 *
 * Contrato de latencia (igual que observeTurn): primero el chequeo determinista
 * (gratis); después una llamada al LLM con tope de reloj. Timeout, error o JSON
 * inválido ⇒ se acepta la línea: el juez nunca bloquea la conversación.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import {
  buildFidelityPrompt,
  detectTimeDrift,
  FAIL_OPEN,
  parseFidelity,
  TIME_DRIFT,
  type FidelityVerdict,
} from "@/domain/chat/scene-fidelity";
import { FIDELITY_MAX_TOKENS } from "@/domain/shared/token-budgets";

/** Tope de espera del juez: pasado esto, la línea se acepta. */
const FIDELITY_BUDGET_MS = 4000;

export interface JudgeSceneFidelityArgs {
  llm: LlmGenerate;
  facts: string;
  personaName: string;
  personaRole: string;
  situationTitle: string;
  reply: string;
  timeoutMs?: number;
}

export async function judgeSceneFidelity(args: JudgeSceneFidelityArgs): Promise<FidelityVerdict> {
  const { llm, facts, reply } = args;
  // Sin hechos no hay contra qué juzgar.
  if (!facts.trim()) return FAIL_OPEN;
  if (detectTimeDrift(reply, facts)) return TIME_DRIFT;
  const prompt = buildFidelityPrompt({ ...args, facts, reply });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), args.timeoutMs ?? FIDELITY_BUDGET_MS);
  });
  try {
    const raw = await Promise.race([llm({ prompt, maxTokens: FIDELITY_MAX_TOKENS }), timeout]);
    return raw === null ? FAIL_OPEN : parseFidelity(raw);
  } catch {
    return FAIL_OPEN;
  } finally {
    clearTimeout(timer);
  }
}
