/** Borra el progreso del pathway de un usuario en un solo nivel CEFR. */

import type { IPathwayRepository } from "@/domain/pathway/i-pathway-repository";

/** Elimina todas las filas del pathway para (userId, cefrLevel). */
export class ResetLevelUseCase {
  constructor(private readonly repo: IPathwayRepository) {}

  async execute(userId: number, cefrLevel: string): Promise<void> {
    await this.repo.reset(userId, cefrLevel);
  }
}
