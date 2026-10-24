import { describe, it, expect } from "vitest";
import { probeDevice } from "../device-probe";
import { LITERT_MODELS } from "@/lib/litert-models";

const minRamGB = Math.min(...LITERT_MODELS.map((m) => m.minRamGB));

describe("probeDevice", () => {
  it("junta WebGPU, la RAM del main y la mínima del modelo más liviano", async () => {
    const cap = await probeDevice({ webgpu: async () => true, totalRamGB: async () => 4 });
    expect(cap).toEqual({ webgpu: true, ramGB: 4, minRamGB });
  });

  it("si una sonda falla queda desconocida, no rompe la puerta", async () => {
    const cap = await probeDevice({
      webgpu: async () => { throw new Error("gpu"); },
      totalRamGB: async () => { throw new Error("ipc"); },
    });
    expect(cap).toEqual({ webgpu: undefined, ramGB: undefined, minRamGB });
  });
});
