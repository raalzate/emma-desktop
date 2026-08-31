/** Persiste el buffer de errores silenciosos de una sesión como stats por categoría. */

import type { SilentError } from "@/domain/chat/silent-error";
import { statsFromErrors } from "@/domain/progression/error-stats";
import type { IErrorStatsRepository } from "@/domain/progression/i-error-stats-repository";

/** Colapsa SilentErrors en ErrorStats y los agrega al repositorio. */
export class RecordSessionErrorsUseCase {
  constructor(private readonly repo: IErrorStatsRepository) {}

  /** Registra los stats de una sesión; no-op cuando el buffer está vacío. */
  async execute(userId: number, errors: SilentError[]): Promise<void> {
    if (errors.length === 0) return;
    await this.repo.record(userId, statsFromErrors(errors));
  }
}
