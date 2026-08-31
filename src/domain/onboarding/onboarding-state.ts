/**
 * Máquina de estados del onboarding conversacional (portado de onboarding_state.py).
 *
 * El nivel de inglés NO se pregunta: todos arrancan en A1 y suben por escenarios.
 * Los 6 pasos van en orden fijo; solo `name` es crítico (no se puede saltar).
 */

export const ONBOARDING_STEPS = [
  "name",
  "age",
  "role",
  "years_in_role",
  "tech_stack",
  "skills",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Pasos sin los cuales no se puede construir un perfil usable (FR-013). */
export const CRITICAL_STEPS: readonly OnboardingStep[] = ["name"];

/** Qué se espera en cada paso, en lenguaje llano (FR-012). */
export const STEP_GUIDANCE: Record<OnboardingStep, string> = {
  name: "Dime tu nombre — lo uso para personalizar nuestras sesiones.",
  age: "Necesito un número para tu edad — por ejemplo: 29.",
  role: "Cuéntame tu rol actual — por ejemplo: Backend Developer o QA Engineer.",
  years_in_role: "Necesito un número de años en tu rol — por ejemplo: 3.",
  tech_stack: "Enumera las tecnologías con las que trabajas — por ejemplo: Python, React, AWS.",
  skills: "Cuéntame algunas habilidades que quieras practicar — por ejemplo: reuniones, entrevistas.",
};

export const SKIP_COMMAND = "skip";
export const SKIP_VALUE = "skipped";

/** True cuando *step* no es esencial para el perfil inicial (FR-013). */
export function canSkip(step: OnboardingStep): boolean {
  return !CRITICAL_STEPS.includes(step);
}

/** Siguiente paso tras *lastCompleted*, o null si era el último. */
export function getNextStep(lastCompleted: OnboardingStep | null): OnboardingStep | null {
  if (lastCompleted === null) return ONBOARDING_STEPS[0];
  const idx = ONBOARDING_STEPS.indexOf(lastCompleted);
  // Paso desconocido → reiniciar desde el principio (paridad con el .py).
  if (idx === -1) return ONBOARDING_STEPS[0];
  const nextIdx = idx + 1;
  return nextIdx < ONBOARDING_STEPS.length ? ONBOARDING_STEPS[nextIdx] : null;
}
