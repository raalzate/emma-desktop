/**
 * «Explain with Emma» en el drill: una llamada al LLM por ítem y respuesta,
 * con caché en memoria; un fallo del modelo devuelve null, nunca rompe el drill.
 */

import { describe, it, expect, vi } from "vitest";
import { explainExerciseItem } from "../explain-exercise-item-use-case";
import type { UnitExercise } from "@/domain/exercises/exercise";
import type { LlmGenerateArgs } from "@/domain/ai/llm-port";

const exercise: UnitExercise = {
  id: "P1.5",
  unit: 0,
  kind: "classify",
  promptEs: "¿Cómo suena la -ed final?",
  items: [{ stem: "shipped", answer: "/t/" }],
};
const item = exercise.items[0];
const GOOD = "WORD: shipped\nIPA: /ʃɪpt/\nTRANSLATION: enviado\nWHY: /p/ es sorda.\nEXAMPLE: We shipped it.\nEXAMPLE_ES: Lo enviamos.";

describe("explainExerciseItem", () => {
  it("pide la explicación al modelo y la devuelve estructurada", async () => {
    const llm = vi.fn(async (_args: LlmGenerateArgs) => GOOD);
    const out = await explainExerciseItem({ llm, exercise, item, given: "/ɪd/" });
    expect(out?.word).toBe("shipped");
    expect(out?.translationEs).toBe("enviado");
    expect(llm).toHaveBeenCalledTimes(1);
    expect(llm.mock.calls[0]?.[0].maxTokens ?? 0).toBeGreaterThan(0);
  });
  it("cachea por ítem y respuesta: la segunda vez no llama al modelo", async () => {
    const llm = vi.fn(async () => GOOD);
    await explainExerciseItem({ llm, exercise, item, given: "x" });
    await explainExerciseItem({ llm, exercise, item, given: "x" });
    expect(llm).toHaveBeenCalledTimes(1);
  });
  it("si el modelo falla o responde basura, devuelve null", async () => {
    expect(await explainExerciseItem({ llm: async () => { throw new Error("boom"); }, exercise, item, given: "a" })).toBeNull();
    expect(await explainExerciseItem({ llm: async () => "lorem ipsum", exercise, item, given: "b" })).toBeNull();
  });
});
