/**
 * ¿Local o nube? Decide qué motor recomendar en la primera pantalla según lo que
 * el equipo puede correr. Sin WebGPU el modelo local no arranca; con menos RAM que
 * la mínima del modelo más liviano, arranca mal. Lo desconocido no penaliza: la
 * recomendación ordena opciones, nunca prohíbe la local.
 */

export type EngineRecommendation =
  | { engine: "local"; reason: "ok" }
  | { engine: "cloud"; reason: "no-webgpu" | "low-ram" };

export interface DeviceCapacity {
  webgpu: boolean | undefined;
  ramGB: number | undefined;
  minRamGB: number;
}

const knownRam = (ramGB: number | undefined): ramGB is number =>
  typeof ramGB === "number" && Number.isFinite(ramGB) && ramGB > 0;

export function recommendEngine({ webgpu, ramGB, minRamGB }: DeviceCapacity): EngineRecommendation {
  if (webgpu === false) return { engine: "cloud", reason: "no-webgpu" };
  if (knownRam(ramGB) && ramGB < minRamGB) return { engine: "cloud", reason: "low-ram" };
  return { engine: "local", reason: "ok" };
}
