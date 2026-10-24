import { describe, it, expect } from "vitest";
import { recommendEngine } from "../engine-recommendation";

describe("recommendEngine", () => {
  it("con WebGPU y RAM suficiente recomienda el motor local", () => {
    expect(recommendEngine({ webgpu: true, ramGB: 16, minRamGB: 8 })).toEqual({ engine: "local", reason: "ok" });
  });

  it("sin WebGPU recomienda la nube: el modelo local no puede correr", () => {
    expect(recommendEngine({ webgpu: false, ramGB: 32, minRamGB: 8 })).toEqual({ engine: "cloud", reason: "no-webgpu" });
  });

  it("con RAM por debajo de la mínima del modelo más liviano recomienda la nube", () => {
    expect(recommendEngine({ webgpu: true, ramGB: 4, minRamGB: 8 })).toEqual({ engine: "cloud", reason: "low-ram" });
  });

  it("la RAM justo en la mínima alcanza", () => {
    expect(recommendEngine({ webgpu: true, ramGB: 8, minRamGB: 8 }).engine).toBe("local");
  });

  it("sin WebGPU pesa más que la RAM baja como motivo", () => {
    expect(recommendEngine({ webgpu: false, ramGB: 2, minRamGB: 8 }).reason).toBe("no-webgpu");
  });

  it("RAM desconocida (o inválida) no penaliza", () => {
    expect(recommendEngine({ webgpu: true, ramGB: undefined, minRamGB: 8 }).engine).toBe("local");
    expect(recommendEngine({ webgpu: true, ramGB: 0, minRamGB: 8 }).engine).toBe("local");
    expect(recommendEngine({ webgpu: true, ramGB: Number.NaN, minRamGB: 8 }).engine).toBe("local");
  });

  it("WebGPU desconocido no penaliza", () => {
    expect(recommendEngine({ webgpu: undefined, ramGB: 16, minRamGB: 8 }).engine).toBe("local");
  });
});
