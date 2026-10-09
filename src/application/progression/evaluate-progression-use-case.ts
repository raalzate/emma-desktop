/** Evalúa la métrica de sesión, actualiza la racha y promueve CEFR al alcanzar el umbral. */

import { isCefrLevel, nextLevel } from "@/domain/cefr/cefr-ladder";
import type { IProfileLevelRepository } from "@/domain/profile/i-profile-level-repository";
import type { IProgressionRepository } from "@/domain/progression/i-progression-repository";
import type { ProgressionState } from "@/domain/progression/progression-state";
import { isPass, isPromotionReady } from "@/domain/progression/promotion-policy";
import type { SessionMetric } from "@/domain/progression/session-metric";

/** Resultado de una pasada de evaluación. */
export interface ProgressionResult {
  promoted: boolean;
  oldLevel: string;
  newLevel: string;
  streak: number;
}

function nextState(
  userId: number,
  currentLevel: string,
  priorStreak: number,
  passed: boolean,
): [ProgressionState, boolean] {
  const streak = passed ? priorStreak + 1 : 0;
  const promotedLevel = isPromotionReady(streak) ? nextLevel(currentLevel) : null;
  const finalLevel = promotedLevel ?? currentLevel;
  const finalStreak = promotedLevel ? 0 : streak;
  const state: ProgressionState = { userId, level: finalLevel, streak: finalStreak };
  return [state, promotedLevel !== null];
}

/** Archivador del historial al superar un nivel (lo cumple ArchiveHistoryOnLevelUpUseCase). */
export interface LevelUpArchiver {
  execute(fromLevel: string): Promise<unknown>;
}

/** Puntúa una sesión, persiste racha/nivel nuevos y devuelve el resultado de promoción. */
export class EvaluateProgressionUseCase {
  constructor(
    private readonly repo: IProgressionRepository,
    private readonly profile: IProfileLevelRepository,
    private readonly archive: LevelUpArchiver,
    private readonly now: () => string,
  ) {}

  async execute(
    userId: number,
    currentLevel: string,
    metric: SessionMetric,
  ): Promise<ProgressionResult> {
    const prior = await this.repo.get(userId);
    const priorStreak = prior ? prior.streak : 0;
    const [state, promoted] = nextState(
      userId,
      currentLevel,
      priorStreak,
      isPass(metric, currentLevel),
    );
    await this.repo.upsert(state);
    if (promoted) await this.applyPromotion(currentLevel, state.level);
    return { promoted, oldLevel: currentLevel, newLevel: state.level, streak: state.streak };
  }

  /** El perfil es la fuente de verdad del nivel; el historial del nivel superado se archiva. */
  private async applyPromotion(oldLevel: string, newLevel: string): Promise<void> {
    if (isCefrLevel(newLevel)) await this.profile.setEnglishLevel(newLevel, this.now());
    await this.archive.execute(oldLevel);
  }
}
