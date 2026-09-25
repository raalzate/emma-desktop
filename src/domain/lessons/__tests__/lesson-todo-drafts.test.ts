import { describe, it, expect } from "vitest";
import { draftFromChallenge, draftFromRecommendation } from "../lesson-todo-drafts";
import { addLessonTodo } from "../lesson-todo";
import type { PracticeRecommendation } from "@/domain/tutor/practice-recommender";

const origin = {
  sessionAt: 10,
  scenarioType: "daily_standup",
  scenarioTitle: "Daily Standup",
};

describe("draftFromRecommendation — cada recomendación sabe su destino", () => {
  const casos: Array<[PracticeRecommendation, string]> = [
    [
      { kind: "exercise", exerciseId: "u13-fill", unit: 13, reasonEs: "artículos" },
      "/practice?tab=exercises&unit=13&exercise=u13-fill",
    ],
    [{ kind: "srs-review", due: 7, reasonEs: "repaso" }, "/practice?tab=srs"],
    [
      { kind: "minimal-pair", contrastId: "i-vs-ii", reasonEs: "vocales" },
      "/practice?tab=pronunciation&contrast=i-vs-ii",
    ],
    [
      { kind: "checklist", level: "B1", reasonEs: "checklist" },
      "/practice?tab=assessment&level=B1",
    ],
    [
      { kind: "scenario", scenarioType: "sprint_planning", reasonEs: "escenario" },
      "/chat?scenario=sprint_planning",
    ],
  ];

  it.each(casos)("%o abre %s", (rec, href) => {
    const draft = draftFromRecommendation(rec, origin);
    expect(draft.href).toBe(href);
    expect(draft.reasonEs).toBe(rec.reasonEs);
    expect(draft.origin.scenarioTitle).toBe("Daily Standup");
  });

  it("dos recomendaciones distintas del mismo tipo no se pisan", () => {
    const a = draftFromRecommendation(
      { kind: "exercise", exerciseId: "u13-fill", unit: 13, reasonEs: "artículos" },
      origin,
    );
    const b = draftFromRecommendation(
      { kind: "exercise", exerciseId: "u14-order", unit: 14, reasonEs: "orden" },
      origin,
    );
    expect(addLessonTodo(addLessonTodo([], a, 1), b, 2)).toHaveLength(2);
  });
});

describe("draftFromChallenge", () => {
  it("anota el reto de la unidad con su destino y su consigna", () => {
    const draft = draftFromChallenge({ unit: 16, instructionsEs: "Escribe tu update" }, origin);
    expect(draft.kind).toBe("challenge");
    expect(draft.href).toBe("/practice?tab=challenges&unit=16");
    expect(draft.titleEs).toContain("16");
    expect(draft.reasonEs).toBe("Escribe tu update");
  });
});
