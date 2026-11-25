/**
 * Precalentar el modelo local al abrir la app (T16 de #323): la primera
 * generación del día cargaba el modelo y la medimos en 123 s para los hechos de
 * la primera escena. Una generación mínima en segundo plano lo carga mientras
 * el aprendiz mira el mapa; cualquier generación interactiva la interrumpe.
 */
import { describe, expect, it, vi } from "vitest";
import { prewarmLocalModel } from "../prewarm";
import type { LlmGenerate } from "@/domain/ai/llm-port";

describe("prewarmLocalModel", () => {
  it("pide una generación mínima en segundo plano, etiquetada", async () => {
    const llm = vi.fn<LlmGenerate>(async () => "OK");
    await prewarmLocalModel(llm, "local");
    expect(llm).toHaveBeenCalledTimes(1);
    expect(llm.mock.calls[0][0]).toMatchObject({ priority: "background", tag: "prewarm", maxTokens: 4 });
  });

  it("con la IA en la nube no hay nada que cargar", async () => {
    const llm = vi.fn<LlmGenerate>(async () => "OK");
    await prewarmLocalModel(llm, "remote");
    expect(llm).not.toHaveBeenCalled();
  });

  it("un fallo o una preempción no se propagan", async () => {
    const llm: LlmGenerate = async () => {
      throw new Error("Generation aborted");
    };
    await expect(prewarmLocalModel(llm, "hybrid")).resolves.toBeUndefined();
  });
});
