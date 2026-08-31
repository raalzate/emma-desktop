// =============================================================================
// Proveedores de IA — abstracción uniforme sobre cada motor.
//
// Añadir un motor nuevo = añadir un proveedor aquí; el router (router.ts) y los
// puntos de llamada (useAi) no cambian. Ese desacople es la base del escalado.
//
//  - local  : Gemma (.litertlm) en el RENDERER vía WebGPU (LiteRT-LM). Texto
//             corto/medio, gratis, offline. Ideal para el flujo por turnos de EMMA.
//  - remote : nube (Gemini/OpenAI/Anthropic). Razonamiento complejo y salida
//             estructurada. Requiere API key (cifrada en el proceso main).
// =============================================================================

export type ProviderId = "local" | "remote";

import { litertGenerate } from "./litert-engine";
import { getSelectedLitertModelFile } from "@/lib/litert-models";

const api = () => (typeof window !== "undefined" ? window.emmaAPI : undefined);

/** IA local disponible: corre en el renderer (LiteRT-LM / WebGPU) dentro de Electron. */
export const localAvailable = (): boolean => !!api();

/** IA remota disponible: el main expone generación por proveedor. */
export const remoteAvailable = (): boolean => !!api()?.remoteGenerate;

/** Genera texto con la IA local (LiteRT-LM, WebGPU, renderer). One-shot. */
export async function runLocal(prompt: string, system?: string): Promise<string> {
  const text = await litertGenerate(getSelectedLitertModelFile(), [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    { role: "user" as const, content: prompt },
  ]);
  return (text || "").trim();
}

/** No usado en EMMA (sin flujos Genkit); se conserva para compatibilidad del router. */
export async function runRemoteFlow(_flow: string, _input: any): Promise<any> {
  throw new Error("Flujos remotos no disponibles en EMMA Desktop.");
}

/**
 * Genera texto con un proveedor REMOTO (nube). La petición HTTP y la llave viven
 * en el proceso main (safeStorage); aquí sólo se invoca por IPC.
 */
export async function remoteGenerateText(
  provider: string,
  model: string,
  prompt: string,
  system?: string
): Promise<string> {
  const a = api();
  if (!a?.remoteGenerate) throw new Error("IA remota no disponible.");
  return a.remoteGenerate({ provider, model, prompt, system });
}
