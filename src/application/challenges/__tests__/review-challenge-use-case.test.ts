import { describe, it, expect } from "vitest";
import { reviewChallenge } from "../review-challenge-use-case";
import type { UnitChallenge } from "@/domain/curriculum/unit";
import type { LlmGenerate } from "@/domain/ai/llm-port";

const challenge: UnitChallenge = {
  id: 5,
  instructionsEs: "Escribe un mensaje de estado del incidente.",
  criteria: ["Usa pasado simple", "Menciona el impacto"],
  mode: "written",
};

describe("reviewChallenge", () => {
  it("parsea la revisión estructurada del LLM (criterios + comentario + versión mejorada)", async () => {
    const llm: LlmGenerate = async () =>
      JSON.stringify({
        criteria: [true, false],
        commentEs: "Falta decir a quién afectó.",
        improved: "We deployed on Tuesday and it broke for 200 users.",
      });
    const review = await reviewChallenge({ llm, challenge, text: "We deploy on Tuesday." });
    expect(review).toEqual({
      criteriaMet: [true, false],
      commentEs: "Falta decir a quién afectó.",
      improved: "We deployed on Tuesday and it broke for 200 users.",
    });
  });

  it("tolera texto alrededor del JSON y criterios de longitud distinta", async () => {
    const llm: LlmGenerate = async () =>
      'Sure! ```json\n{"criteria":[true],"commentEs":"Bien.","improved":""}\n```';
    const review = await reviewChallenge({ llm, challenge, text: "text" });
    expect(review?.criteriaMet).toEqual([true, false]);
    expect(review?.improved).toBeNull();
  });

  it("devuelve null si el LLM no responde algo válido", async () => {
    const llm: LlmGenerate = async () => "no idea";
    expect(await reviewChallenge({ llm, challenge, text: "text" })).toBeNull();
  });

  it("un objeto vacío no es una revisión: devuelve null (no marca todo como no cumplido)", async () => {
    const llm: LlmGenerate = async () => "{}";
    expect(await reviewChallenge({ llm, challenge, text: "text" })).toBeNull();
  });

  it("pasa los criterios y la entrega al prompt", async () => {
    let seen = "";
    const llm: LlmGenerate = async (args) => {
      seen = args.prompt;
      return "{}";
    };
    await reviewChallenge({ llm, challenge, text: "my delivery" });
    expect(seen).toContain("Usa pasado simple");
    expect(seen).toContain("my delivery");
  });
});
