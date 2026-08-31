/** Repositorio de progresión CEFR sobre el almacén JSON. */

import type { IProgressionRepository } from "@/domain/progression/i-progression-repository";
import type { ProgressionState } from "@/domain/progression/progression-state";
import { readOne, writeOne } from "./store-client";

const KEY = "progression";

export function createProgressionRepository(): IProgressionRepository {
  return {
    async get() {
      return readOne<ProgressionState>(KEY);
    },
    async upsert(state) {
      await writeOne(KEY, state);
    },
  };
}
