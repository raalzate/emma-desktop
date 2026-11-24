/** Guard de primer arranque (FR-031): ¿hay que correr el chequeo antes del onboarding? */
import type { ISetupCheckRepository } from "@/domain/setup/i-setup-check-repository";
import { requiresFirstRunCheck } from "@/domain/setup/setup-check-record";

export async function needsFirstRunCheck(a: {
  repo: ISetupCheckRepository;
  onboardingCompleted: boolean;
}): Promise<boolean> {
  try {
    return requiresFirstRunCheck({ onboardingCompleted: a.onboardingCompleted, last: await a.repo.last() });
  } catch {
    // Un JSON roto no debe bloquear la app.
    return false;
  }
}
