/**
 * Casos de uso de los retos del libro (paso 7, output forzado): traen el reto
 * de la sesión activa, registran la entrega del usuario y el progreso global.
 * El puerto `IChallengeRepository` se inyecta por argumento.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import {
  challengeForSession,
  challengeProgress,
  type SessionChallenge,
} from "@/domain/curriculum/challenge-selection";
import type { IChallengeRepository } from "@/domain/curriculum/i-challenge-repository";

/** Reto pendiente de la unidad que ancla la sesión activa (o null si no hay). */
export async function getSessionChallenge({
  repo,
  scenarioType,
  level,
}: {
  repo: IChallengeRepository;
  scenarioType: string;
  level: CefrLevel;
}): Promise<SessionChallenge | null> {
  const completed = await repo.loadCompleted();
  return challengeForSession(scenarioType, level, completed);
}

/** Guarda la entrega de un reto y lo marca como completado. */
export async function submitChallenge({
  repo,
  challengeId,
  text,
}: {
  repo: IChallengeRepository;
  challengeId: number;
  text: string;
}): Promise<void> {
  if (text.trim().length === 0) throw new Error("text must not be empty");

  await repo.saveSubmission(challengeId, text);
  await repo.markCompleted(challengeId);
}

/** Progreso global sobre los 72 retos del libro. */
export async function getChallengeProgress({
  repo,
}: {
  repo: IChallengeRepository;
}): Promise<{ done: number; total: number }> {
  const completed = await repo.loadCompleted();
  return challengeProgress(completed);
}
