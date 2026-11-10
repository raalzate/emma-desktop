/**
 * Registro e historial del chequeo (FR-031, FR-035). Sólo mediciones y
 * diagnósticos: nunca audio ni prompts del usuario.
 */
import type { SetupDiagnosis } from "./diagnose-setup";

export const SETUP_CHECK_VERSION = 1;
export const SETUP_HISTORY_MAX = 20;

export interface SetupCheckRecord {
  version: number;
  at: number;
  trigger: "first-run" | "settings" | "live-failure";
  diagnosis: SetupDiagnosis;
  acknowledged: boolean;
}

export function requiresFirstRunCheck(a: { onboardingCompleted: boolean; last: SetupCheckRecord | null }): boolean {
  if (a.onboardingCompleted) return false;
  if (!a.last) return true;
  if (a.last.version < SETUP_CHECK_VERSION) return true;
  const { verdict } = a.last.diagnosis;
  if (verdict === "blocked") return true;
  return verdict === "warn" && !a.last.acknowledged;
}

/** Más nuevo primero, con tope; no muta la entrada. */
export function appendHistory(h: readonly SetupCheckRecord[], r: SetupCheckRecord): SetupCheckRecord[] {
  return [r, ...h].slice(0, SETUP_HISTORY_MAX);
}

export function canContinue(d: SetupDiagnosis): boolean {
  return d.verdict !== "blocked";
}
