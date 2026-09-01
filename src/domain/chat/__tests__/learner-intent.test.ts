import { describe, expect, it } from "vitest";
import { classifyLearnerIntent, isSceneContribution } from "../learner-intent";

describe("classifyLearnerIntent", () => {
  it("un turno de trabajo es contenido de la escena", () => {
    expect(classifyLearnerIntent("I finished the login API yesterday.")).toBe("in-scene");
    expect(classifyLearnerIntent("No blockers today.")).toBe("in-scene");
  });

  it("un saludo es un saludo, no una respuesta al objetivo pendiente", () => {
    expect(classifyLearnerIntent("Hi Sofía, good morning!")).toBe("greeting");
  });

  it("preguntar por el idioma es meta: el aprendiz salió de la escena", () => {
    expect(classifyLearnerIntent("What does 'blocker' mean?")).toBe("meta");
    expect(classifyLearnerIntent("How do you say 'entregar' in English?")).toBe("meta");
    expect(classifyLearnerIntent("Sorry, I don't understand.")).toBe("meta");
    expect(classifyLearnerIntent("Can you repeat that?")).toBe("meta");
    expect(classifyLearnerIntent("I don't know what to say")).toBe("meta");
  });

  it("escribir en español es salirse de la escena, no un hecho de trabajo", () => {
    expect(classifyLearnerIntent("no entiendo qué me estás preguntando")).toBe("meta");
    expect(classifyLearnerIntent("¿qué significa eso?")).toBe("meta");
  });

  it("no confunde un problema del trabajo con una duda de idioma", () => {
    expect(classifyLearnerIntent("I don't understand the ticket the PM wrote.")).toBe("in-scene");
    expect(classifyLearnerIntent("The deploy is blocked by the migration.")).toBe("in-scene");
  });

  it("un mensaje vacío no aporta nada a la escena", () => {
    expect(classifyLearnerIntent("   ")).toBe("meta");
  });
});

describe("isSceneContribution", () => {
  it("sólo el contenido de escena puede cubrir un objetivo del checklist", () => {
    expect(isSceneContribution("I shipped the API.")).toBe(true);
    expect(isSceneContribution("What does 'standup' mean?")).toBe(false);
    expect(isSceneContribution("Hey, good morning!")).toBe(false);
  });
});
