/**
 * Pregunta directa del aprendiz (T11 de #323): medido en vivo, la persona
 * ignoraba «And you?» y seguía con su propia pregunta.
 */
import { describe, expect, it } from "vitest";
import { answerFirstCue, learnerQuestionOf } from "../learner-question";
import { buildTurnDirective } from "../turn-directive";

describe("learnerQuestionOf", () => {
  it("toma la última pregunta del mensaje", () => {
    expect(learnerQuestionOf("I came for the serverless talk. And you?")).toBe("And you?");
    expect(learnerQuestionOf("Is the demo at 2? Who owns the contract?")).toBe("Who owns the contract?");
  });

  it("sin signo de pregunta no hay pregunta", () => {
    expect(learnerQuestionOf("Yesterday I finished the login page.")).toBeNull();
  });

  it("un pedido de aclaración no es una pregunta de contenido (lo atiende la reparación)", () => {
    expect(learnerQuestionOf("Sorry, can you repeat that?")).toBeNull();
    expect(learnerQuestionOf("What do you mean?")).toBeNull();
  });
});

describe("la directiva contesta primero", () => {
  const base = { state: null, elaborate: false, deepen: false, wrapUp: false, recastCue: "" };

  it("antepone la orden de contestar a la orden de contenido del turno", () => {
    const d = buildTurnDirective({ ...base, wrapUp: true, learnerQuestion: "What is your talk about?" });
    expect(d.indexOf("ANSWER FIRST")).toBe(0);
    expect(d).toContain('"What is your talk about?"');
  });

  it("sin pregunta la directiva no cambia", () => {
    expect(buildTurnDirective({ ...base, learnerQuestion: null })).toBe(buildTurnDirective(base));
  });

  it("en un pedido de reparación manda la reparación", () => {
    const d = buildTurnDirective({ ...base, intent: "meta", learnerQuestion: "And you?" });
    expect(d).not.toContain("ANSWER FIRST");
  });

  it("answerFirstCue nombra la pregunta y pide responder en personaje", () => {
    expect(answerFirstCue("And you?")).toMatch(/ANSWER FIRST .*"And you\?".*in character/);
  });
});
