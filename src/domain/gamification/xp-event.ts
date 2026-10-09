/**
 * Evento de XP: lo único que se persiste (#216, FR-006). Todo lo demás (nivel,
 * racha, logros) se deriva de la lista de eventos, así una regla nueva aplica
 * también al historial.
 */

import { XP_ACTIVITY_KINDS, xpFor, type XpActivity, type XpActivityKind } from "./xp-rules";

export interface XpEvent {
  kind: XpActivityKind;
  xp: number;
  /** Día local (días desde epoch) en que se ganó. */
  day: number;
  /** Instante (ms epoch). */
  at: number;
  /** Conversación sin errores (alimenta el logro «Clean sheet»). */
  clean?: boolean;
}

/** Guarda del borde: el origen es disco local y puede venir corrupto. */
export function isXpEvent(value: unknown): value is XpEvent {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.kind === "string" &&
    (XP_ACTIVITY_KINDS as readonly string[]).includes(e.kind) &&
    typeof e.xp === "number" &&
    Number.isFinite(e.xp) &&
    e.xp >= 0 &&
    typeof e.day === "number" &&
    typeof e.at === "number" &&
    (e.clean === undefined || typeof e.clean === "boolean")
  );
}

function eventFor(activity: XpActivity, at: number, day: number): XpEvent {
  const event: XpEvent = { kind: activity.kind, xp: xpFor(activity), day, at };
  if (activity.kind === "conversation" && activity.turns > 0 && activity.errors === 0) {
    event.clean = true;
  }
  return event;
}

export function eventsFor(activities: readonly XpActivity[], when: { at: number; day: number }): XpEvent[] {
  return activities.map((a) => eventFor(a, when.at, when.day));
}
