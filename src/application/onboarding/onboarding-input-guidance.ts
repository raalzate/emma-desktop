/**
 * Guía por paso para la entrada del onboarding (portado de
 * onboarding_input_guidance.py, FR-012). En vez de un reintento silencioso, se
 * envía un mensaje que explica qué se espera en ese paso.
 */

import type { OnboardingIo } from "@/domain/onboarding/i-onboarding-repository";
import { STEP_GUIDANCE, type OnboardingStep } from "@/domain/onboarding/onboarding-state";

/** Mensaje de expectativa específico del paso (FR-012). */
export async function sendGuidance(step: OnboardingStep, io: OnboardingIo): Promise<void> {
  if (io.notify) await io.notify(STEP_GUIDANCE[step]);
}
