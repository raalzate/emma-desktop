/**
 * Genera el saludo personalizado: 2-3 frases construidas desde el perfil. El
 * LLM SOLO se invoca vía el puerto inyectado `LlmGenerate`; la voz y la
 * persistencia son de quien llama.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { UserProfile } from "@/domain/profile/user-profile";
import { WELCOME_MAX_TOKENS } from "@/domain/shared/token-budgets";
import { buildSystemPrompt, buildUserPrompt } from "@/domain/welcome/prompt-builder";

export interface BuildWelcomeArgs {
  llm: LlmGenerate;
  profile: UserProfile;
  /** Briefing en español (semana/unidad/pendientes) para andamiaje de bienvenida. */
  tutorBriefingEs?: string;
}

/** Devuelve un saludo de 2-3 frases adaptado al nivel CEFR del aprendiz. */
export async function buildWelcome(args: BuildWelcomeArgs): Promise<string> {
  const { llm, profile, tutorBriefingEs } = args;
  const text = await llm({
    prompt: buildUserPrompt(profile),
    system: buildSystemPrompt(tutorBriefingEs),
    maxTokens: WELCOME_MAX_TOKENS,
  });
  return (text ?? "").trim();
}
