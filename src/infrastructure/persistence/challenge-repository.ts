/**
 * Repositorio de retos del libro sobre el almacén JSON (clave "challenges").
 *
 * Guarda un único registro por usuario local con los ids completados y las
 * entregas de texto. Guard clauses al cargar (mismo estilo que
 * `srs-repository.ts`): datos corruptos se descartan en vez de romper la app.
 */

import type {
  ChallengeSubmission,
  IChallengeRepository,
} from "@/domain/curriculum/i-challenge-repository";
import { readOne, writeOne } from "./store-client";

const KEY = "challenges";

interface ChallengesRecord {
  completed: number[];
  submissions: ChallengeSubmission[];
}

const EMPTY: ChallengesRecord = { completed: [], submissions: [] };

function isValidSubmission(value: unknown): value is ChallengeSubmission {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.challengeId === "number" &&
    typeof s.text === "string" &&
    typeof s.submittedAt === "string"
  );
}

/** Valida el shape mínimo del registro leído de disco; descarta lo inválido. */
function sanitize(stored: unknown): ChallengesRecord {
  if (typeof stored !== "object" || stored === null) return EMPTY;
  const record = stored as Record<string, unknown>;
  const completed = Array.isArray(record.completed)
    ? record.completed.filter((id): id is number => typeof id === "number")
    : [];
  const submissions = Array.isArray(record.submissions)
    ? record.submissions.filter(isValidSubmission)
    : [];
  return { completed, submissions };
}

export function createChallengeRepository(): IChallengeRepository {
  async function load(): Promise<ChallengesRecord> {
    const stored = await readOne<ChallengesRecord>(KEY);
    return sanitize(stored);
  }

  return {
    async loadCompleted() {
      return (await load()).completed;
    },
    async markCompleted(id) {
      const record = await load();
      if (record.completed.includes(id)) return;
      await writeOne(KEY, { ...record, completed: [...record.completed, id] });
    },
    async saveSubmission(id, text) {
      const record = await load();
      const rest = record.submissions.filter((s) => s.challengeId !== id);
      const entry: ChallengeSubmission = { challengeId: id, text, submittedAt: new Date().toISOString() };
      await writeOne(KEY, { ...record, submissions: [...rest, entry] });
    },
    async loadSubmissions() {
      return (await load()).submissions;
    },
  };
}
