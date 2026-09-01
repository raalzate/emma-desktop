import { describe, expect, it } from "vitest";
import { buildSuggestionContext, rankByRelevance } from "../suggestion-context";

const base = {
  lastAgentLine: "Anything blocking you today?",
  personaName: "Sofía Torres",
  personaRole: "Scrum Master",
  situationTitle: "Quiet sprint morning",
  saidSoFar: [] as string[],
};

describe("buildSuggestionContext", () => {
  it("dice con quién habla el aprendiz y en qué escena", () => {
    const ctx = buildSuggestionContext(base);
    expect(ctx).toContain("Sofía Torres");
    expect(ctx).toContain("Scrum Master");
    expect(ctx).toContain("Quiet sprint morning");
  });

  it("pone la última línea de la persona como lo que hay que responder", () => {
    expect(buildSuggestionContext(base)).toContain("Anything blocking you today?");
  });

  it("incluye el tema pendiente: sin él las sugerencias no responden la pregunta", () => {
    const ctx = buildSuggestionContext({ ...base, pendingAsk: "their blockers" });
    expect(ctx).toContain("their blockers");
  });

  it("arrastra lo que el aprendiz ya dijo para que no se repita", () => {
    const ctx = buildSuggestionContext({
      ...base,
      saidSoFar: ["I finished the login API.", "Today I start the migration."],
    });
    expect(ctx).toContain("I finished the login API.");
    expect(ctx).toContain("Today I start the migration.");
  });

  it("acota lo ya dicho: el contexto no puede crecer con la escena", () => {
    const ctx = buildSuggestionContext({
      ...base,
      saidSoFar: Array.from({ length: 20 }, (_, i) => `Fact number ${i}.`),
    });
    expect(ctx).not.toContain("Fact number 0.");
    expect(ctx).toContain("Fact number 19.");
  });

  it("sin escena ni persona sigue sirviendo la última línea", () => {
    const ctx = buildSuggestionContext({ lastAgentLine: "How are you?", saidSoFar: [] });
    expect(ctx).toContain("How are you?");
    expect(ctx.trim().length).toBeGreaterThan(0);
  });
});

describe("rankByRelevance", () => {
  const frases = [
    "I'm blocked by the payments API.",
    "Let me walk you through the design.",
    "Nothing is blocking me right now.",
    "Could you review my pull request?",
  ];

  it("pone primero las frases que comparten vocabulario con la pregunta", () => {
    const top = rankByRelevance(frases, "Anything blocking you today?", 2);
    expect(top).toContain("I'm blocked by the payments API.");
    expect(top).toContain("Nothing is blocking me right now.");
  });

  it("devuelve como mucho k frases", () => {
    expect(rankByRelevance(frases, "blocking", 2)).toHaveLength(2);
  });

  it("sin coincidencias devuelve las primeras, no una lista vacía", () => {
    expect(rankByRelevance(frases, "zzzz", 2)).toHaveLength(2);
  });

  it("con lista vacía no inventa nada", () => {
    expect(rankByRelevance([], "blocking", 3)).toEqual([]);
  });
});
