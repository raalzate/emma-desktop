/** Contrato de persistencia para los stats de error por sesión. */

import type { ErrorStat } from "./error-stats";

/** Almacén de sólo-agregado de conteos de error agrupados por sesión. */
export interface IErrorStatsRepository {
  record(userId: number, stats: ErrorStat[]): Promise<void>;
  getRecentStats(userId: number, lastNSessions?: number): Promise<ErrorStat[]>;
}
