/**
 * Caso de uso: observar el turno del aprendiz — el LLM etiqueta, el código
 * decide (ver domain/chat/turn-observation para el porqué).
 *
 * Contrato de latencia: la observación está en el camino crítico del turno
 * (la directiva se construye con ella), así que corre con un tope corto y ante
 * timeout, error o JSON inválido cae a las heurísticas deterministas. El peor
 * caso es exactamente el comportamiento anterior, nunca un turno colgado.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { SceneState } from "@/domain/chat/scene-state";
import {
  buildObservationPrompt,
  fallbackObservation,
  parseObservation,
  type TurnObservation,
} from "@/domain/chat/turn-observation";
import { OBSERVE_MAX_TOKENS } from "@/domain/shared/token-budgets";

/** Tope de espera del juez: pasado esto, la red determinista responde. */
const OBSERVE_BUDGET_MS = 4000;

export interface ObserveTurnArgs {
  llm: LlmGenerate;
  state: SceneState | null;
  lastAgentLine: string;
  message: string;
  level: CefrLevel;
  timeoutMs?: number;
}

export async function observeTurn(args: ObserveTurnArgs): Promise<TurnObservation> {
  const { llm, state, lastAgentLine, message, level } = args;
  const red = () => fallbackObservation({ message, state, lastAgentLine });
  // Sin checklist no hay nada que atribuir: las heurísticas bastan y no se
  // paga una llamada.
  if (!state || state.pending.length === 0) return red();
  const prompt = buildObservationPrompt({
    lastAgentLine,
    message,
    pending: state.pending.map((p) => ({ id: p.id, ask: p.ask })),
    level,
  });
  const timeout = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), args.timeoutMs ?? OBSERVE_BUDGET_MS);
  });
  try {
    const raw = await Promise.race([
      llm({ prompt, maxTokens: OBSERVE_MAX_TOKENS }),
      timeout,
    ]);
    if (raw === null) return red();
    return parseObservation(raw, state.pending.map((p) => p.id)) ?? red();
  } catch {
    return red();
  }
}
