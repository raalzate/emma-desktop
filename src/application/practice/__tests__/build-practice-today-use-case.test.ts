import { describe, it, expect } from "vitest";
import { getPracticeToday } from "../build-practice-today-use-case";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { IChallengeRepository } from "@/domain/curriculum/i-challenge-repository";
import type { SrsCard } from "@/domain/srs/srs-card";

const card = (id: string, box: 1 | 2, last: number): SrsCard => ({
  id,
  kind: "chunk-cloze",
  box,
  lastReviewedDay: last,
  front: "f",
  back: "b",
});

describe("getPracticeToday", () => {
  it("cuenta sólo las tarjetas vencidas y usa el siguiente reto de la unidad activa", async () => {
    const srs: ISrsRepository = {
      loadCards: async () => [card("a", 1, 0), card("b", 2, 10)],
      saveCards: async () => undefined,
    };
    const challenges: IChallengeRepository = {
      loadCompleted: async () => [1],
      markCompleted: async () => undefined,
      saveSubmission: async () => undefined,
      loadSubmissions: async () => [],
    };
    const plan = await getPracticeToday({ srsRepo: srs, challengeRepo: challenges, today: 10, activeUnit: 1 });
    const srsStep = plan.steps.find((s) => s.tab === "srs");
    expect(srsStep?.count).toBe(1);
    const challengeStep = plan.steps.find((s) => s.tab === "challenges");
    expect(challengeStep?.titleEs).toMatch(/Reto \d+/);
    expect(challengeStep?.titleEs).not.toBe("Reto 1");
  });
});
