import { describe, expect, it } from "vitest";
import type {
  ChallengeSubmission,
  IChallengeRepository,
} from "@/domain/curriculum/i-challenge-repository";
import {
  getChallengeProgress,
  getSessionChallenge,
  submitChallenge,
} from "../complete-challenge-use-case";

/** Repo falso en memoria; misma forma que el adaptador real. */
function fakeRepo(completed: number[] = []): IChallengeRepository {
  const state = { completed: [...completed], submissions: [] as ChallengeSubmission[] };
  return {
    async loadCompleted() {
      return state.completed;
    },
    async markCompleted(id) {
      if (!state.completed.includes(id)) state.completed.push(id);
    },
    async saveSubmission(id, text) {
      state.submissions = state.submissions.filter((s) => s.challengeId !== id);
      state.submissions.push({ challengeId: id, text, submittedAt: "2026-07-31T00:00:00.000Z" });
    },
    async loadSubmissions() {
      return state.submissions;
    },
  };
}

describe("getSessionChallenge", () => {
  it("devuelve la unidad y el reto pendiente para el escenario y nivel de la sesión", async () => {
    const repo = fakeRepo();
    const result = await getSessionChallenge({
      repo,
      scenarioType: "intro_yourself",
      level: "A1",
    });

    expect(result).not.toBeNull();
    expect(result?.unit.scenarioTypes).toContain("intro_yourself");
  });

  it("devuelve null si el escenario no tiene unidad asociada", async () => {
    const repo = fakeRepo();
    const result = await getSessionChallenge({
      repo,
      scenarioType: "no-existe",
      level: "A1",
    });

    expect(result).toBeNull();
  });
});

describe("submitChallenge", () => {
  it("guarda la entrega y marca el reto como completado", async () => {
    const repo = fakeRepo();

    await submitChallenge({ repo, challengeId: 1, text: "Hi, I'm a backend developer." });

    expect(await repo.loadCompleted()).toContain(1);
    const submissions = await repo.loadSubmissions();
    expect(submissions[0].text).toBe("Hi, I'm a backend developer.");
  });

  it("rechaza texto vacío", async () => {
    const repo = fakeRepo();

    await expect(
      submitChallenge({ repo, challengeId: 1, text: "   " }),
    ).rejects.toThrow("text must not be empty");
  });
});

describe("getChallengeProgress", () => {
  it("devuelve el progreso global sobre los 72 retos", async () => {
    const repo = fakeRepo([1, 2]);

    const progress = await getChallengeProgress({ repo });

    expect(progress).toEqual({ done: 2, total: 72 });
  });
});
