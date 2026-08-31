import { describe, it, expect } from "vitest";
import { LITERT_SAMPLER_PARAMS } from "../litert-engine";
import { DEFAULT_LITERT_MODEL_ID } from "@/lib/litert-models";

describe("configuración local por defecto (adherencia de la protopersona)", () => {
  it("el modelo por defecto es gemma-e4b", () => {
    expect(DEFAULT_LITERT_MODEL_ID).toBe("gemma-e4b");
  });

  it("la temperatura de muestreo es ≤ 0.6", () => {
    expect(LITERT_SAMPLER_PARAMS.temperature).toBeLessThanOrEqual(0.6);
  });
});
