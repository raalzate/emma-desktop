/**
 * Caso de uso: apertura de la simulación.
 *
 * Envía la señal de escena para que EMMA hable primero, en su rol, sin que el
 * usuario tenga que iniciar. Reutiliza runChatTurn (mismo tope de 60s + streaming)
 * con historial vacío.
 */

import { kickoffCue } from "@/domain/chat/simulation-prompt-text";
import { runChatTurn } from "./run-chat-turn-use-case";
import type { LlmGenerate } from "@/domain/ai/llm-port";

export interface RunKickoffArgs {
  llm: LlmGenerate;
  system: string;
  /** Mismo sessionId que los turnos siguientes: la apertura queda en la memoria viva. */
  sessionId?: string;
  /** Nombre del aprendiz: la persona abre saludándolo, no preguntando en seco. */
  learnerName?: string;
  onToken?: (chunk: string) => void;
}

/** Emite el turno de apertura de EMMA (el saludo que abre la escena). */
export async function runKickoff(args: RunKickoffArgs): Promise<string> {
  const text = await runChatTurn({
    llm: args.llm,
    system: args.system,
    history: [],
    userMessage: kickoffCue(args.learnerName),
    sessionId: args.sessionId,
    onToken: args.onToken,
  });
  return text.trim();
}
