/**
 * Constructor del prompt del saludo personalizado (portado VERBATIM de
 * prompt_builder.py). El prompt en inglés se preserva tal cual.
 *
 * En el .py el prompt se poblaba desde UserWelcomeContext; aquí se toma directo
 * del UserProfile. `goals` (learning goals) se deriva de `skills`.
 */

import type { UserProfile } from "@/domain/profile/user-profile";

const SYSTEM_PROMPT =
  "You are EMMA, a professional English coach for software engineers. " +
  "Generate a short (2-3 sentences) personalised welcome message in English. " +
  "Adapt vocabulary and sentence complexity to the user's CEFR level. " +
  "Tone: friendly and motivating. No markdown, no lists, no bullet points.";

/**
 * Instrucción de sistema para la generación del saludo. Si viene `tutorBriefingEs`
 * (semana/unidad/pendientes del plan), se añade la orden de mencionar en ESPAÑOL
 * una guía breve de por dónde seguir — el saludo es andamiaje, no la escena.
 */
export function buildSystemPrompt(tutorBriefingEs?: string): string {
  if (!tutorBriefingEs) return SYSTEM_PROMPT;
  return (
    `${SYSTEM_PROMPT} After the welcome message, add ONE short sentence in Spanish ` +
    `(scaffolding, not part of the English scene) pointing the learner to what's next, ` +
    `based on this study-plan briefing: "${tutorBriefingEs}".`
  );
}

/** Prompt de usuario poblado con el perfil del aprendiz. */
export function buildUserPrompt(profile: UserProfile): string {
  return (
    `Name: ${profile.name}\n` +
    `CEFR Level: ${profile.englishLevel || "unknown"}\n` +
    `Role: ${profile.role || "not specified"}\n` +
    `Tech Stack: ${profile.techStack || "not specified"}\n` +
    `Learning Goals: ${formatGoals(profile.skills)}`
  );
}

function formatGoals(skills: string): string {
  const goals = skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  return goals.length ? goals.join(", ") : "none specified";
}
