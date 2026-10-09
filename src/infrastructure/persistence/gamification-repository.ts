/**
 * Repositorio de eventos de XP sobre el almacén JSON (clave "gamification").
 *
 * Mismo patrón que session-metrics-repository.ts: la guarda vive en el dominio
 * (`isXpEvent`) y descarta entradas corruptas en vez de lanzar. El tope evita
 * que el archivo crezca sin límite; a ~50 actividades por día alcanza para más
 * de un año de historial.
 */

import type { IGamificationRepository } from "@/domain/gamification/i-gamification-repository";
import { isXpEvent, type XpEvent } from "@/domain/gamification/xp-event";
import { readOne, writeOne } from "./store-client";

const KEY = "gamification";

export const MAX_STORED_EVENTS = 20_000;

interface GamificationRecord {
  events: XpEvent[];
}

async function loadEvents(): Promise<XpEvent[]> {
  const stored = await readOne<unknown>(KEY);
  const events = (stored as { events?: unknown } | null)?.events;
  return Array.isArray(events) ? events.filter(isXpEvent) : [];
}

export function createGamificationRepository(): IGamificationRepository {
  return {
    load: loadEvents,
    async append(events) {
      const current = await loadEvents();
      await writeOne<GamificationRecord>(KEY, { events: [...current, ...events].slice(-MAX_STORED_EVENTS) });
    },
  };
}
