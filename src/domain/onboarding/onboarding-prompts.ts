/**
 * API pública de las preguntas del onboarding y el resumen del perfil
 * (portado de onboarding_prompts.py).
 */

import { ONBOARDING_STEPS } from "@/domain/onboarding/onboarding-state";
import {
  buildErrorNote,
  TEMPLATES,
  type QuestionContext,
} from "@/domain/onboarding/onboarding-prompts-data";

// `resume` no es un paso, pero se admite como frase de bienvenida al retomar.
const ALLOWED_STEPS: readonly string[] = [...ONBOARDING_STEPS, "resume"];

/**
 * Pregunta cálida y personalizada para el paso dado.
 * @param attempt 0 = frase principal, 1 = reintento más suave.
 */
export function getQuestion(step: string, context: QuestionContext, attempt = 0): string {
  if (!ALLOWED_STEPS.includes(step)) {
    throw new Error(`Unknown step: '${step}'. Must be one of ${ALLOWED_STEPS.join(", ")}.`);
  }
  if (attempt !== 0 && attempt !== 1) {
    throw new Error(`Invalid attempt: ${attempt}. Must be 0 or 1.`);
  }
  const [primary, retry] = TEMPLATES[step];
  return (attempt === 0 ? primary : retry)(context);
}

/** Resumen personalizado del perfil con invitación a simular. */
export function buildSummary(context: QuestionContext, errorCount = 0): string {
  const name = context.name ? String(context.name) : "there";
  const role = context.role ? String(context.role) : "tech professional";
  const techStack = context.tech_stack ? String(context.tech_stack) : "your stack";
  const years = context.years_in_role;
  const yearsStr = years ? `${years} year(s) of experience` : "some experience";

  return (
    `You're all set, ${name}! Here's a quick snapshot of your profile:\n\n` +
    `🧑‍💻 Role: ${role} with ${yearsStr}\n` +
    `⚙️  Stack: ${techStack}\n` +
    `${buildErrorNote(errorCount)}` +
    `\nWhenever you're ready, just say the word and we'll dive in!`
  );
}
