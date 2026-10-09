/**
 * Puerto para actualizar el nivel de inglés del perfil (fuente de verdad que lee
 * toda la app) cuando la progresión promueve al aprendiz.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

export interface IProfileLevelRepository {
  /** Escribe `profile.englishLevel` y su fecha de actualización (ISO). */
  setEnglishLevel(level: CefrLevel, at: string): Promise<void>;
}
