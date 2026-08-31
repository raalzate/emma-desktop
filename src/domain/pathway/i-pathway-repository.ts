/** Contrato de persistencia para el progreso del pathway. */

import type { PathwayStatus } from "./pathway-status";

/** Almacén async indexado por (userId, cefrLevel, scenarioType). */
export interface IPathwayRepository {
  getStatuses(userId: number, cefrLevel: string): Promise<Record<string, PathwayStatus>>;
  mark(
    userId: number,
    cefrLevel: string,
    scenarioType: string,
    status: PathwayStatus,
  ): Promise<void>;
  reset(userId: number, cefrLevel: string): Promise<void>;
}
