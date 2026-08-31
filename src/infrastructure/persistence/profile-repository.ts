/**
 * Repositorio de perfil sobre el almacén JSON — implementa el puerto
 * OnboardingRepository del dominio y expone lecturas para otras capas.
 */

import type { OnboardingRepository } from "@/domain/onboarding/i-onboarding-repository";
import { emptyProfile, type UserProfile } from "@/domain/profile/user-profile";
import { LOCAL_USER, readOne, writeOne } from "./store-client";

const KEY = "profiles";

/** Perfil actual del usuario local (o null si no existe). */
export async function loadProfile(): Promise<UserProfile | null> {
  return readOne<UserProfile>(KEY);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await writeOne(KEY, profile);
}

/** Mapea el nombre de paso (snake_case) al campo del perfil. */
const STEP_FIELD: Record<string, keyof UserProfile> = {
  name: "name",
  age: "age",
  role: "role",
  years_in_role: "yearsInRole",
  tech_stack: "techStack",
  skills: "skills",
};

export function createProfileRepository(): OnboardingRepository {
  return {
    async getStatus() {
      return loadProfile();
    },
    async createEmpty() {
      const p = { ...emptyProfile(LOCAL_USER), onboardingState: "in_progress" as const };
      await saveProfile(p);
      return p;
    },
    async saveStep(step, value) {
      const current = (await loadProfile()) ?? emptyProfile(LOCAL_USER);
      const field = STEP_FIELD[step];
      if (!field) return;
      const next = { ...current, [field]: value, onboardingStepLastCompleted: step };
      await saveProfile(next as UserProfile);
    },
    async markCompleted() {
      const current = (await loadProfile()) ?? emptyProfile(LOCAL_USER);
      await saveProfile({
        ...current,
        onboardingState: "completed",
        onboardingCompletedAt: new Date().toISOString(),
      });
    },
  };
}
