/**
 * Métricas del banco de conversaciones guiadas (T4 de #323). Puras: reciben
 * los turnos medidos por el driver CDP y devuelven SC-001…SC-007.
 */
import { describe, expect, it } from "vitest";
// @ts-expect-error módulo .mjs sin tipos
import { isRecovery, isReask, answersLearnerQuestion, percentile, summarize } from "../eval-simulacion-metricas.mjs";

describe("detectores de texto", () => {
  it("isRecovery reconoce las frases de rescate", () => {
    expect(isRecovery("Sorry, let me put it another way — what did you do yesterday?")).toBe(true);
    expect(isRecovery("I lost my train of thought — where were we?")).toBe(true);
    expect(isRecovery("So you finished the login, right?")).toBe(false);
  });

  it("isReask: la persona repite una pregunta suya ya contestada", () => {
    const earlier = ["Hi Raul, what did you do yesterday?"];
    expect(isReask("Okay. So, what did you do yesterday?", earlier)).toBe(true);
    expect(isReask("Nice. What are you working on today?", earlier)).toBe(false);
    expect(isReask("Great, thanks.", earlier)).toBe(false);
  });

  it("answersLearnerQuestion: si el aprendiz pregunta, la respuesta no abre con otra pregunta", () => {
    expect(answersLearnerQuestion("And you?", "I'm doing a talk on Kafka. What about your team?")).toBe(true);
    expect(answersLearnerQuestion("And you?", "Which part was hardest for you?")).toBe(false);
    expect(answersLearnerQuestion("I'm fine.", "Which part was hardest?")).toBeNull();
  });
});

describe("percentile y summarize", () => {
  it("percentile por rango más cercano", () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95)).toBe(10);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50)).toBe(5);
    expect(percentile([], 95)).toBeNull();
  });

  it("summarize calcula los SC y marca cuáles pasan", () => {
    const conversations = [
      {
        sceneReadyMs: 8000,
        turns: [
          { learner: "Hi.", reply: "Hi! What did you do yesterday?", firstVisibleMs: 1500, doneMs: 3500, criticalCalls: 2, earlierQuestions: [] },
          {
            learner: "I fixed the login. And you?",
            reply: "Sorry, let me put it another way — what did you do yesterday?",
            firstVisibleMs: 2500,
            doneMs: 6000,
            criticalCalls: 4,
            earlierQuestions: ["Hi! What did you do yesterday?"],
          },
        ],
      },
    ];
    const s = summarize(conversations);
    expect(s.turns).toBe(2);
    expect(s.sc001.p95).toBe(2500);
    expect(s.sc002.p95).toBe(6000);
    expect(s.sc003.max).toBe(4);
    expect(s.sc004.count).toBe(1);
    expect(s.sc005.rate).toBe(0.5);
    expect(s.sc006.rate).toBe(0);
    expect(s.sc007.p95).toBe(8000);
    expect(s.pass).toEqual({
      sc001: false,
      sc002: false,
      sc003: false,
      sc004: false,
      sc005: false,
      sc006: false,
      sc007: true,
    });
  });
});
