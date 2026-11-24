/**
 * Estado del chequeo en la UI (puro, testeable sin React): corrida completa,
 * «Test again» de una sonda o fallo inesperado. El diagnóstico ya llega fusionado
 * desde el caso de uso, así que el reducer sólo lo guarda.
 */
import type { ProbeName, SetupDiagnosis } from "@/domain/setup/diagnose-setup";
import type { SetupCheckRecord } from "@/domain/setup/setup-check-record";

/**
 * Origen a guardar: la corrida automática inicial conserva el de la compuerta;
 * «Run again» / «Test again» son manuales (`settings`).
 */
export function triggerForRun(initial: SetupCheckRecord["trigger"], repeat: boolean): SetupCheckRecord["trigger"] {
  return repeat ? "settings" : initial;
}

/** Carga en frío del modelo, informativa (no es causa de lentitud). */
export const firstLoadLabel = (loadMs: number): string => `first load ${Math.max(1, Math.round(loadMs / 1000))} s`;

export interface SetupState {
  diagnosis: SetupDiagnosis | null;
  running: boolean;
  retesting: ProbeName | null;
  failed: boolean;
}

export type SetupAction =
  | { type: "run-start" }
  | { type: "retest-start"; probe: ProbeName }
  | { type: "run-done"; diagnosis: SetupDiagnosis }
  | { type: "run-failed" };

export const initialSetupState: SetupState = { diagnosis: null, running: false, retesting: null, failed: false };

export function setupReducer(state: SetupState, action: SetupAction): SetupState {
  switch (action.type) {
    case "run-start":
      return { diagnosis: null, running: true, retesting: null, failed: false };
    case "retest-start":
      return { ...state, running: false, retesting: action.probe, failed: false };
    case "run-done":
      return { diagnosis: action.diagnosis, running: false, retesting: null, failed: false };
    case "run-failed":
      return { ...state, running: false, retesting: null, failed: true };
  }
}
