/**
 * Umbrales y predicados que gobiernan la promoción CEFR.
 *
 * La barra se endurece al subir: un A1 aprueba con más deslices por turno que un
 * candidato C1 — calificar a todos con la misma barra bloquea a principiantes o
 * subexige a avanzados.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { errorsPerTurn, type SessionMetric } from "./session-metric";

export const PASS_ERRORS_PER_TURN = 0.25; // barra B1; también fallback de nivel desconocido
export const PROMOTION_STREAK = 3;
export const MIN_TURNS_TO_COUNT = 5;

const LEVEL_PASS_BAR: Record<CefrLevel, number> = {
  A1: 0.45,
  A2: 0.35,
  B1: 0.25,
  B2: 0.18,
  C1: 0.12,
};

/** Máx errores/turno que todavía aprueban en *level* (fallback: barra B1). */
export function passBar(level: string | null | undefined): number {
  return LEVEL_PASS_BAR[(level ?? "") as CefrLevel] ?? PASS_ERRORS_PER_TURN;
}

/** True cuando la sesión cuenta para una racha de promoción en *level*. */
export function isPass(metric: SessionMetric, level?: string | null): boolean {
  if (metric.turns < MIN_TURNS_TO_COUNT) return false;
  return errorsPerTurn(metric) <= passBar(level);
}

/** True cuando hay suficientes aprobados consecutivos para promover. */
export function isPromotionReady(streak: number): boolean {
  return streak >= PROMOTION_STREAK;
}
