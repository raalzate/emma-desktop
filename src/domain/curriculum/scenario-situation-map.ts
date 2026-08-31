/**
 * Mapeo situación (PHRASE_BANK, Apéndice G) -> escenarios EMMA que la practican.
 * Puro dato: permite a coaching/lección elegir frases relevantes según el
 * escenario activo de la sesión (búsqueda inversa vía `situationForScenario`).
 */

import type { PhraseBankEntry } from "@/domain/reference/reference";

type Situation = PhraseBankEntry["situation"];

const SITUATION_SCENARIOS: Record<Situation, string[]> = {
  standup: ["daily_standup"],
  code_review: ["code_review"],
  incident: ["incident_postmortem", "bug_triage", "oncall_handover", "escalation_call"],
  meeting: [
    "retrospective",
    "release_planning",
    "multi_team_sync",
    "sprint_review",
    "meeting_recap",
    "design_review",
  ],
  interview: ["tech_interview", "behavioral_qa"],
  one_on_one: ["peer_feedback_1on1", "mentor_junior"],
  small_talk: ["coffee_break", "lunch_chat", "morning_greeting", "conference_intro"],
};

/** Situación del banco de frases que corresponde a un escenario EMMA, o undefined. */
export function situationForScenario(scenarioType: string): Situation | undefined {
  const entry = Object.entries(SITUATION_SCENARIOS).find(([, scenarios]) =>
    scenarios.includes(scenarioType),
  );
  return entry ? (entry[0] as Situation) : undefined;
}
