/**
 * Sonda del equipo para la puerta de IA: ¿hay WebGPU? ¿cuánta RAM? Alimenta
 * `recommendEngine` (dominio). Una sonda que falla devuelve «desconocido» en
 * lugar de romper: la recomendación sólo ordena las opciones.
 */

import type { DeviceCapacity } from "@/domain/ai/engine-recommendation";
import { LITERT_MODELS } from "@/lib/litert-models";

export interface DeviceProbes {
  webgpu: () => Promise<boolean>;
  totalRamGB: () => Promise<number>;
}

const MIN_RAM_GB = Math.min(...LITERT_MODELS.map((m) => m.minRamGB));

async function orUndefined<T>(probe: () => Promise<T>): Promise<T | undefined> {
  try {
    return await probe();
  } catch {
    return undefined;
  }
}

const defaultProbes: DeviceProbes = {
  // Import diferido: el motor LiteRT no se carga sólo para preguntar por WebGPU.
  webgpu: async () => (await import("./litert-engine")).webgpuAvailable(),
  totalRamGB: async () => {
    const api = window.emmaAPI;
    if (!api) throw new Error("sin puente");
    return (await api.litertModelsList()).totalRamGB;
  },
};

export async function probeDevice(probes: DeviceProbes = defaultProbes): Promise<DeviceCapacity> {
  const [webgpu, ramGB] = await Promise.all([orUndefined(probes.webgpu), orUndefined(probes.totalRamGB)]);
  return { webgpu, ramGB, minRamGB: MIN_RAM_GB };
}
