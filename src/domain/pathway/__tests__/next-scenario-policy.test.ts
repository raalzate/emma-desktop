import { describe, expect, it } from "vitest";
import { createPathwayItem } from "../pathway-item";
import { recommendNext, RecommendationReason } from "../next-scenario-policy";
import type { Pathway } from "../pathway";

function pathwayWith(...items: ReturnType<typeof createPathwayItem>[]): Pathway {
  return { cefrLevel: "A1", items };
}

describe("recommendNext", () => {
  it("devuelve null si no hay items pendientes", () => {
    expect(recommendNext({ cefrLevel: "A1", items: [] }, [], null)).toBeNull();
  });

  it("prioriza el escenario que ejercita el error recurrente", () => {
    const pathway = pathwayWith(
      createPathwayItem("daily_standup", "Daily Standup"),
      createPathwayItem("intro_yourself", "Intro Yourself"),
    );
    const result = recommendNext(pathway, [], "grammar");
    expect(result?.scenarioType).toBe("daily_standup");
    expect(result?.reason).toBe(RecommendationReason.ERROR_FOCUS);
  });

  it("sin boost de plan, mantiene el orden de catálogo entre items sin señal", () => {
    const pathway = pathwayWith(
      createPathwayItem("coffee_break", "Coffee Break"),
      createPathwayItem("conference_intro", "Conference Intro"),
    );
    const result = recommendNext(pathway, [], null);
    expect(result?.scenarioType).toBe("coffee_break");
    expect(result?.reason).toBe(RecommendationReason.CATALOG_ORDER);
  });

  it("con la semana actual del plan, da boost al escenario de la unidad de esa semana", () => {
    // Semana 5 del plan cubre solo la unidad 3, que ejercita "system_walkthrough".
    const pathway = pathwayWith(
      createPathwayItem("coffee_break", "Coffee Break"),
      createPathwayItem("system_walkthrough", "System Walkthrough"),
    );
    const result = recommendNext(pathway, [], null, 5);
    expect(result?.scenarioType).toBe("system_walkthrough");
    expect(result?.reason).toBe(RecommendationReason.PLAN_MATCH);
  });

  it("sin unidades para la semana dada, no aplica boost de plan", () => {
    // Semana 1 es de fonética: no cubre unidades, así que no hay boost.
    const pathway = pathwayWith(
      createPathwayItem("coffee_break", "Coffee Break"),
      createPathwayItem("system_walkthrough", "System Walkthrough"),
    );
    const result = recommendNext(pathway, [], null, 1);
    expect(result?.scenarioType).toBe("coffee_break");
    expect(result?.reason).toBe(RecommendationReason.CATALOG_ORDER);
  });
});
