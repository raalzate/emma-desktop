/** Estado de un item del pathway — pendiente vs aprobado. */

/** Ciclo de vida de dos estados para cada escenario en un pathway CEFR. */
export const PathwayStatus = {
  PENDING: "pending",
  PASSED: "passed",
} as const;

export type PathwayStatus = (typeof PathwayStatus)[keyof typeof PathwayStatus];
