/** ScenarioRecommendation + ScenarioRecommender. */

/** Un escenario recomendado para una meta y nivel CEFR dados. */
export interface ScenarioRecommendation {
  scenarioType: string;
  goalName: string;
  cefrRange: string[];
  title: string;
}

const TI = "Technical Interviews";
const LD = "Leading Dailies";
const WC = "Written Communication";
const IM = "International Meetings";
const NW = "Networking";

export const SCENARIO_CATALOG: ScenarioRecommendation[] = [
  { scenarioType: "tech_interview", goalName: TI, cefrRange: ["B1", "B2", "C1"], title: "Mock Technical Interview" },
  { scenarioType: "behavioral_qa", goalName: TI, cefrRange: ["B1", "B2", "C1"], title: "Behavioral Q&A" },
  { scenarioType: "daily_standup", goalName: LD, cefrRange: ["A2", "B1", "B2", "C1"], title: "Daily Standup" },
  { scenarioType: "sprint_review", goalName: LD, cefrRange: ["B1", "B2", "C1"], title: "Sprint Review Presentation" },
  { scenarioType: "slack_thread", goalName: WC, cefrRange: ["B1", "B2", "C1"], title: "Async Slack Thread" },
  { scenarioType: "status_report", goalName: WC, cefrRange: ["B1", "B2", "C1"], title: "Written Status Report" },
  { scenarioType: "multi_team_sync", goalName: IM, cefrRange: ["B2", "C1"], title: "Multi-team Sync" },
  { scenarioType: "stakeholder_pres", goalName: IM, cefrRange: ["B2", "C1"], title: "Stakeholder Presentation" },
  { scenarioType: "conference_intro", goalName: NW, cefrRange: ["A2", "B1", "B2"], title: "Conference Introduction" },
  { scenarioType: "team_social", goalName: NW, cefrRange: ["A2", "B1", "B2"], title: "Team Social" },
];

/** Recomienda escenarios según las metas del usuario y un nivel CEFR opcional. */
export class ScenarioRecommender {
  recommend(
    goals: string[],
    cefrLevel: string | null,
    maxResults = 2,
  ): ScenarioRecommendation[] {
    const goalSet = new Set(goals);
    const results = SCENARIO_CATALOG.filter(
      (s) => goalSet.has(s.goalName) && (cefrLevel === null || s.cefrRange.includes(cefrLevel)),
    );
    return results.slice(0, maxResults);
  }
}
