/**
 * Caso de uso: preguntarle a EMMA en el chat de apoyo de la práctica (#357, T8).
 * El modelo entra por inyección; la pregunta se valida en el borde y un fallo
 * del modelo nunca llega al aprendiz como error técnico.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { buildTutorPrompt, TUTOR_SYSTEM, validTutorQuestion, type TutorTurn } from "@/domain/tutor/tutor-chat";

export const TUTOR_FALLBACK = "Sorry, I couldn't answer that right now. Try asking again in a moment.";

const TUTOR_MAX_TOKENS = 220;

/** null ⇒ la pregunta no era válida (vacía o demasiado larga) y no se consultó al modelo. */
export async function askTutor(a: {
  llm: LlmGenerate;
  question: string;
  level: CefrLevel;
  history: readonly TutorTurn[];
}): Promise<string | null> {
  const question = validTutorQuestion(a.question);
  if (!question) return null;
  try {
    const raw = await a.llm({
      tag: "tutor-chat",
      system: TUTOR_SYSTEM,
      prompt: buildTutorPrompt({ question, level: a.level, history: a.history }),
      maxTokens: TUTOR_MAX_TOKENS,
    });
    return raw.trim() || TUTOR_FALLBACK;
  } catch {
    return TUTOR_FALLBACK;
  }
}
