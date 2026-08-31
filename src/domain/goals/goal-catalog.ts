/** Constantes del catálogo de metas y helpers de validación. */

import { titleCase } from "@/domain/shared/text-case";

// El orden de inserción importa: alimenta el catálogo numerado del onboarding.
export const GOAL_CATALOG: Record<string, number> = {
  "Technical Interviews": 0.9,
  "Leading Dailies": 0.8,
  "Written Communication": 0.75,
  "International Meetings": 0.7,
  Networking: 0.6,
};

/** Limpia y title-casa el string crudo; devuelve el nombre canónico o null. */
export function normalizeGoal(raw: string): string | null {
  const candidate = titleCase(raw.trim());
  return candidate in GOAL_CATALOG ? candidate : null;
}

/** Separa tokens crudos en [válidos canónicos, tokens inválidos sin match]. */
export function validateGoals(rawList: string[]): [string[], string[]] {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const token of rawList) {
    const canonical = normalizeGoal(token);
    if (canonical !== null) valid.push(canonical);
    else invalid.push(token);
  }
  return [valid, invalid];
}
