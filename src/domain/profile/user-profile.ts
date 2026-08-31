/**
 * Perfil del aprendiz (portado de la tabla `user_context`).
 *
 * Se recoge en el onboarding conversacional (name → age → role → years_in_role →
 * tech_stack → skills). El nivel de inglés NO se pregunta: arranca en A1 y sube
 * por escenarios.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

export type OnboardingState = "not_started" | "in_progress" | "completed";

export interface UserProfile {
  /** Identificador (username de la cuenta local). */
  id: string;
  name: string;
  age: number | null;
  role: string;
  yearsInRole: number | null;
  techStack: string;
  skills: string;
  englishLevel: CefrLevel;
  englishLevelUpdatedAt: string | null;
  onboardingState: OnboardingState;
  onboardingStepLastCompleted: string | null;
  onboardingStartedAt: string | null;
  onboardingCompletedAt: string | null;
  quickReplyHintSeen: boolean;
  preferredTranslationLanguage: string | null;
}

export function emptyProfile(id: string): UserProfile {
  return {
    id,
    name: "",
    age: null,
    role: "",
    yearsInRole: null,
    techStack: "",
    skills: "",
    englishLevel: "A1",
    englishLevelUpdatedAt: null,
    onboardingState: "not_started",
    onboardingStepLastCompleted: null,
    onboardingStartedAt: null,
    onboardingCompletedAt: null,
    quickReplyHintSeen: false,
    preferredTranslationLanguage: null,
  };
}

/** Bloque `USER PROFILE` para inyectar en el prompt de simulación. */
export function profileBlock(p: UserProfile): string {
  const lines = [
    p.name && `- Name: ${p.name}`,
    p.role && `- Role: ${p.role}`,
    p.yearsInRole != null && `- Years in role: ${p.yearsInRole}`,
    p.techStack && `- Tech stack: ${p.techStack}`,
    p.skills && `- Skills / interests: ${p.skills}`,
    `- English level (CEFR): ${p.englishLevel}`,
  ].filter(Boolean);
  return `USER PROFILE (the learner you are talking to):\n${lines.join("\n")}`;
}
