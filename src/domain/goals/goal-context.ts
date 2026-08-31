/** GoalContext + GoalContextBuilder. */

import type { UserGoal } from "./user-goal";

// Metas que disparan el modo de vocabulario.
const WRITTEN_GOALS = new Set(["Written Communication"]);
const SPOKEN_GOALS = new Set(["Technical Interviews", "Leading Dailies"]);

const GOAL_TO_SCENARIO: Record<string, string> = {
  "Technical Interviews": "tech_interview",
  "Leading Dailies": "daily_standup",
  "Written Communication": "slack_thread",
  "International Meetings": "multi_team_sync",
  Networking: "conference_intro",
};

/** Contexto de sesión derivado de las metas de aprendizaje del usuario. */
export interface GoalContext {
  userId: number;
  activeGoals: string[];
  priorityWeights: Record<string, number>;
  scenarioPriorities: string[];
  vocabMode: string;
}

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const x of a) if (b.has(x)) return true;
  return false;
}

/** Construye un GoalContext a partir de una lista de UserGoal. */
export class GoalContextBuilder {
  build(userId: number, goals: UserGoal[]): GoalContext {
    // sorted estable por peso descendente (empates conservan orden original).
    const sorted = [...goals].sort((a, b) => b.priorityWeight - a.priorityWeight);
    const activeGoals = sorted.map((g) => g.goalName);
    const priorityWeights: Record<string, number> = {};
    for (const g of sorted) priorityWeights[g.goalName] = g.priorityWeight;
    return {
      userId,
      activeGoals,
      priorityWeights,
      scenarioPriorities: this.deriveScenarioPriorities(sorted),
      vocabMode: this.deriveVocabMode(activeGoals),
    };
  }

  private deriveScenarioPriorities(sortedGoals: UserGoal[]): string[] {
    return sortedGoals
      .filter((g) => g.goalName in GOAL_TO_SCENARIO)
      .map((g) => GOAL_TO_SCENARIO[g.goalName]);
  }

  private deriveVocabMode(activeGoals: string[]): string {
    const goalSet = new Set(activeGoals);
    const hasWritten = intersects(goalSet, WRITTEN_GOALS);
    const hasSpoken = intersects(goalSet, SPOKEN_GOALS);
    if (hasWritten && !hasSpoken) return "technical_written";
    if (intersects(goalSet, SPOKEN_GOALS)) return "technical_spoken";
    return "mixed";
  }
}
