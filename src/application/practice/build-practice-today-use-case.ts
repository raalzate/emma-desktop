/**
 * Arma el plan de práctica del día: hidrata tarjetas vencidas y progreso de
 * retos desde sus puertos (inyectados) y delega el orden al dominio.
 */

import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { IChallengeRepository } from "@/domain/curriculum/i-challenge-repository";
import { dueCards } from "@/domain/srs/leitner";
import { challengeProgress, nextChallengeForUnit } from "@/domain/curriculum/challenge-selection";
import { buildPracticeToday, type PracticeToday } from "@/domain/practice/practice-today";

export async function getPracticeToday({
  srsRepo,
  challengeRepo,
  today,
  activeUnit,
}: {
  srsRepo: ISrsRepository;
  challengeRepo: IChallengeRepository;
  today: number;
  activeUnit: number | null;
}): Promise<PracticeToday> {
  const [cards, completed] = await Promise.all([srsRepo.loadCards(), challengeRepo.loadCompleted()]);
  const nextChallenge = activeUnit === null ? null : nextChallengeForUnit(activeUnit, completed);
  return buildPracticeToday({
    dueCards: dueCards(cards, today).length,
    challenges: challengeProgress(completed),
    nextChallengeId: nextChallenge?.id ?? null,
    activeUnit,
  });
}
