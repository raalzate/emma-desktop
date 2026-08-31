/** Resultado calificado de una simulación terminada. */

/** Si una sesión terminada superó el escenario, se quedó corta, o fue muy breve. */
export const SessionVerdict = {
  PASSED: "passed",
  FAILED: "failed",
  INCOMPLETE: "incomplete",
} as const;

export type SessionVerdict = (typeof SessionVerdict)[keyof typeof SessionVerdict];
