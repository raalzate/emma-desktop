/** Repositorio del progreso del pathway sobre el almacén JSON. */

import type { IPathwayRepository } from "@/domain/pathway/i-pathway-repository";
import { PathwayStatus } from "@/domain/pathway/pathway-status";
import { readCollection, LOCAL_USER } from "./store-client";

const KEY = "pathway";

// Estructura: { [LOCAL_USER]: { [cefrLevel]: { [scenarioType]: status } } }
type ByLevel = Record<string, Record<string, PathwayStatus>>;

async function load(): Promise<ByLevel> {
  const all = await readCollection<ByLevel>(KEY);
  return all[LOCAL_USER] ?? {};
}

async function persist(byLevel: ByLevel): Promise<void> {
  const api = typeof window !== "undefined" ? window.emmaAPI : undefined;
  if (!api) return;
  const all = (await api.storeGet(KEY)) as Record<string, ByLevel>;
  all[LOCAL_USER] = byLevel;
  await api.storeSet(KEY, all as Record<string, unknown>);
}

export function createPathwayRepository(): IPathwayRepository {
  return {
    async getStatuses(_userId, cefrLevel) {
      return (await load())[cefrLevel] ?? {};
    },
    async mark(_userId, cefrLevel, scenarioType, status) {
      const byLevel = await load();
      byLevel[cefrLevel] = { ...(byLevel[cefrLevel] ?? {}), [scenarioType]: status };
      await persist(byLevel);
    },
    async reset(_userId, cefrLevel) {
      const byLevel = await load();
      delete byLevel[cefrLevel];
      await persist(byLevel);
    },
  };
}
