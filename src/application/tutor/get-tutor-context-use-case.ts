/**
 * Orquesta la construcción del TutorContext real: hidrata tarjetas SRS,
 * checklist marcado y conteos de error por categoría desde sus repos (DI por
 * argumento) y arma el contexto + el briefing en español para EMMA. `today`
 * se inyecta (sin `Date.now()` oculto) para que la orquestación sea testeable.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { ISelfAssessmentRepository } from "@/domain/curriculum/i-self-assessment-repository";
import type { IErrorStatsRepository } from "@/domain/progression/i-error-stats-repository";
import { buildTutorContext, type TutorContext } from "@/domain/tutor/tutor-context";
import { buildTutorBriefing } from "@/domain/tutor/system-map";

export interface GetTutorContextArgs {
  srsRepo: ISrsRepository;
  selfAssessmentRepo: ISelfAssessmentRepository;
  errorStatsRepo: IErrorStatsRepository;
  level: CefrLevel;
  today: number;
  userId: number;
  activeUnit?: number;
  activeScenarioType?: string;
}

export interface GetTutorContextResult {
  context: TutorContext;
  briefingEs: string;
}

/** Suma los ErrorStat (pueden repetirse por categoría) en un Record categoría→conteo. */
function toErrorCounts(stats: { errorType: string; count: number }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const stat of stats) {
    counts[stat.errorType] = (counts[stat.errorType] ?? 0) + stat.count;
  }
  return counts;
}

export async function getTutorContext(args: GetTutorContextArgs): Promise<GetTutorContextResult> {
  const [cards, checkedChecklistIds, stats] = await Promise.all([
    args.srsRepo.loadCards(),
    args.selfAssessmentRepo.loadChecked(),
    args.errorStatsRepo.getRecentStats(args.userId),
  ]);

  const context = buildTutorContext({
    level: args.level,
    cards,
    today: args.today,
    errorCounts: toErrorCounts(stats),
    checkedChecklistIds,
    activeUnit: args.activeUnit,
    activeScenarioType: args.activeScenarioType,
  });

  return { context, briefingEs: buildTutorBriefing(context) };
}
