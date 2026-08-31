import { describe, expect, it } from "vitest";

import { situationForScenario } from "../scenario-situation-map";

describe("situationForScenario", () => {
  it("mapea el escenario daily_standup a la situación standup del banco de frases", () => {
    expect(situationForScenario("daily_standup")).toBe("standup");
  });

  it("mapea code_review a code_review", () => {
    expect(situationForScenario("code_review")).toBe("code_review");
  });

  it("mapea varios escenarios de incidente a la situación incident", () => {
    expect(situationForScenario("bug_triage")).toBe("incident");
    expect(situationForScenario("oncall_handover")).toBe("incident");
    expect(situationForScenario("escalation_call")).toBe("incident");
    expect(situationForScenario("incident_postmortem")).toBe("incident");
  });

  it("mapea varios escenarios de reunión a la situación meeting", () => {
    expect(situationForScenario("retrospective")).toBe("meeting");
    expect(situationForScenario("release_planning")).toBe("meeting");
    expect(situationForScenario("multi_team_sync")).toBe("meeting");
    expect(situationForScenario("sprint_review")).toBe("meeting");
    expect(situationForScenario("meeting_recap")).toBe("meeting");
    expect(situationForScenario("design_review")).toBe("meeting");
  });

  it("mapea escenarios de entrevista a interview", () => {
    expect(situationForScenario("tech_interview")).toBe("interview");
    expect(situationForScenario("behavioral_qa")).toBe("interview");
  });

  it("mapea escenarios 1:1 a one_on_one", () => {
    expect(situationForScenario("peer_feedback_1on1")).toBe("one_on_one");
    expect(situationForScenario("mentor_junior")).toBe("one_on_one");
  });

  it("mapea escenarios informales a small_talk", () => {
    expect(situationForScenario("coffee_break")).toBe("small_talk");
    expect(situationForScenario("lunch_chat")).toBe("small_talk");
    expect(situationForScenario("morning_greeting")).toBe("small_talk");
    expect(situationForScenario("conference_intro")).toBe("small_talk");
  });

  it("devuelve undefined para un escenario sin mapeo", () => {
    expect(situationForScenario("no_existe")).toBeUndefined();
  });
});
