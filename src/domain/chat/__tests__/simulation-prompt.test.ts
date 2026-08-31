import { describe, it, expect } from "vitest";
import { buildSimulationPrompt } from "../simulation-prompt";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { ChatSettings } from "@/domain/chat-settings/chat-settings";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import { emptyProfile } from "@/domain/profile/user-profile";

const scenario: Scenario = {
  scenarioType: "daily_standup",
  title: "Daily Standup",
  description: "Report yesterday's work, today's plan and blockers to your team.",
  category: "meetings",
  cefrRange: ["A1", "B1"],
  emmaRole: "Scrum Master",
  roleSystemPrompt: "You are the Scrum Master running the daily standup.",
  tier: "basics",
};

const settings = {} as ChatSettings;

const situation = {
  id: "daily_standup.blocker_dependency",
  scenarioType: "daily_standup",
  character: "conflict",
  cefrLevels: ["B1"],
  stackHints: [],
  retired: false,
  title: "Blocked by another team's deliverable",
  framingDescription:
    "Your work is blocked by another team. Lead the standup and state the blocker plainly.",
} as unknown as SituationVariant;

describe("buildSimulationPrompt — objetivo de escena", () => {
  it("incluye un bloque SCENE GOAL con la descripción del escenario", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
    });
    expect(prompt).toMatch(/SCENE GOAL/);
    expect(prompt).toMatch(/Report yesterday's work/);
  });

  it("indica el presupuesto de turnos del escenario para dirigir el cierre", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
    });
    // daily_standup tiene presupuesto 8 en MAX_TURNS_BY_SCENARIO.
    expect(prompt).toMatch(/8/);
    expect(prompt).toMatch(/wrap up/i);
  });
});

describe("buildSimulationPrompt — protopersona", () => {
  it("encarna a la protopersona del escenario (nombre propio + personalidad)", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
    });
    // daily_standup → Sofía Torres, Scrum Master del catálogo de protopersonas.
    expect(prompt).toMatch(/Sofía Torres/);
    expect(prompt).toMatch(/YOU ARE THIS PERSON/i);
  });

  it("el estilo del personaje sale del tuning de la protopersona, no de Emma", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
      personaTuning: { tone: "casual", attitude: "sarcastic", voiceStyle: "concise" },
    });
    expect(prompt).toMatch(/CHARACTER STYLE/);
    expect(prompt).toMatch(/sarcasm|sarcastic/i);
    expect(prompt).not.toMatch(/AGENT STYLE/);
  });

  it("sin tuning explícito usa el default del personaje (bloque presente)", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
    });
    expect(prompt).toMatch(/CHARACTER STYLE/);
  });

  it("incluye la guarda anti-meta: jamás analizar el wording del aprendiz", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
    });
    expect(prompt).toMatch(/META GUARD/);
    expect(prompt).toMatch(/never .*(analyse|analyze|comment on) the learner'?s wording/i);
    expect(prompt).toMatch(/bracket/i);
  });
});

describe("buildSimulationPrompt — situación activa comportamental (BUG-001)", () => {
  const args = {
    scenario,
    situation,
    settings,
    profile: emptyProfile("u1"),
    level: "B1" as const,
  };

  it("declara que la misión del framing es del APRENDIZ, no de la persona", () => {
    const prompt = buildSimulationPrompt(args);
    expect(prompt).toMatch(/LEARNER'S MISSION/);
    expect(prompt).toMatch(/refers to the LEARNER/i);
    expect(prompt).toContain("Your work is blocked by another team.");
  });

  it("separa el papel de la IA: actuar su rol y abrir espacio a la misión del aprendiz", () => {
    const prompt = buildSimulationPrompt(args);
    expect(prompt).toMatch(/YOUR PART/);
    expect(prompt).toMatch(/Sofía Torres/);
  });

  it("sin situación no emite bloque de misión del aprendiz", () => {
    const prompt = buildSimulationPrompt({ ...args, situation: null });
    expect(prompt).not.toMatch(/LEARNER'S MISSION/);
  });
});

describe("buildSimulationPrompt — hechos concretos de escena (BUG-001)", () => {
  it("exige detalles concretos y consistentes, prohibiendo meta-pasos abstractos", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
    });
    expect(prompt).toMatch(/SCENE FACTS/);
    expect(prompt).toMatch(/keep them consistent/i);
    expect(prompt).toMatch(/never talk in abstract meta-steps/i);
  });
});

describe("buildSimulationPrompt — hechos del contrato de escena (BUG-001)", () => {
  it("con sceneFacts los inyecta como guardrail fijo en lugar del bloque genérico", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
      sceneFacts:
        "Project: Claude Code integration.\nYesterday: finished the report.\nToday: demo at risk from yesterday's code review.",
    });
    expect(prompt).toMatch(/SCENE FACTS \(fixed/);
    expect(prompt).toContain("Claude Code integration");
    expect(prompt).toMatch(/never contradict/i);
    expect(prompt).not.toMatch(/invent concrete details/i);
  });

  it("sin sceneFacts conserva el bloque genérico de inventar detalles", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
    });
    expect(prompt).toMatch(/invent concrete details/i);
  });
});

describe("buildSimulationPrompt — presupuesto de contexto (BUG-001)", () => {
  it("el prompt completo (con situación) no supera 330 palabras — modelo local pequeño", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      situation,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
      goals: ["standup updates", "code review english"],
    });
    expect(prompt.split(/\s+/).length).toBeLessThanOrEqual(330);
  });

  it("incluye un ejemplo few-shot del estilo esperado (mostrar > prohibir)", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
    });
    expect(prompt).toMatch(/STYLE EXAMPLE/);
    expect(prompt).toMatch(/Learner: /);
  });
});

describe("personaAnchor — ancla de personaje por turno (BUG-001)", () => {
  it("incluye nombre y rol de la protopersona y la orden de seguir en personaje", async () => {
    const { personaAnchor } = await import("../simulation-prompt");
    const anchor = personaAnchor(scenario);
    expect(anchor).toMatch(/Sofía Torres/);
    expect(anchor).toMatch(/Scrum Master/);
    expect(anchor).toMatch(/stay in character/i);
    expect(anchor).toMatch(/never .*(AI|language model)/i);
  });
});

describe("buildSimulationPrompt — foco de la unidad del libro (languageFocus)", () => {
  it("con languageFocus lo inyecta en el prompt (chunks objetivo + trampas)", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
      languageFocus: "LANGUAGE FOCUS (Unit 4: Daily standup basics)\n- No blockers.",
    });
    expect(prompt).toContain("LANGUAGE FOCUS (Unit 4: Daily standup basics)");
    expect(prompt).toContain("No blockers.");
  });

  it("sin languageFocus no añade el bloque", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
    });
    expect(prompt).not.toMatch(/LANGUAGE FOCUS/);
  });
});

describe("buildSimulationPrompt — solo inglés (BUG-001)", () => {
  it("exige responder ENGLISH ONLY, sin otros idiomas ni escrituras", () => {
    const prompt = buildSimulationPrompt({
      scenario,
      settings,
      profile: emptyProfile("u1"),
      level: "B1",
    });
    expect(prompt).toMatch(/ENGLISH ONLY/);
    expect(prompt).toMatch(/never .*(language|script)/i);
  });
});
