/**
 * Estado del chequeo en la UI (puro, testeable sin React): corrida completa,
 * «Test again» de una sonda o fallo inesperado. El diagnóstico ya llega fusionado
 * desde el caso de uso, así que el reducer sólo lo guarda.
 */
import type { ProbeName, SetupDiagnosis } from "@/domain/setup/diagnose-setup";

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
