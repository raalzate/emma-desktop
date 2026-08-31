/**
 * Repositorio de autoevaluación (ids marcados A1→B2) sobre el almacén JSON.
 *
 * Mismo patrón que srs-repository.ts: sin Zod (dato local, no externo);
 * guard clauses mínimas al cargar para descartar entradas corruptas sin
 * romper la app.
 */

import type { ISelfAssessmentRepository } from "@/domain/curriculum/i-self-assessment-repository";
import { readOne, writeOne } from "./store-client";

// Debe existir en STORE_KEYS (main/services/store-keys.ts) o el store rechaza la escritura.
const KEY = "selfAssessment";

export function createSelfAssessmentRepository(): ISelfAssessmentRepository {
  return {
    async loadChecked() {
      const stored = await readOne<unknown[]>(KEY);
      if (!Array.isArray(stored)) return [];
      return stored.filter((id): id is string => typeof id === "string");
    },
    async saveChecked(ids) {
      await writeOne(KEY, ids);
    },
  };
}
