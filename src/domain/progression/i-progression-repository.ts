/** Contrato de almacenamiento para el estado de progresión CEFR por usuario. */

import type { ProgressionState } from "./progression-state";

/**
 * Puerto de persistencia inyectado en los casos de uso — nunca la infra concreta.
 */
export interface IProgressionRepository {
  get(userId: number): Promise<ProgressionState | null>;
  upsert(state: ProgressionState): Promise<void>;
}
