/**
 * ¿Está la IA lista para inferir? EMMA necesita un motor real antes de conversar:
 *  - modo local/hybrid → al menos un modelo Gemma (.litertlm) descargado;
 *  - modo remote → una API key configurada para el proveedor elegido.
 * Sin esto, cualquier llamada al LLM fallaría ("Failed to fetch") — así que la UI
 * primero pide descargar el modelo.
 *
 * Modo remote sin llave pero con un Gemma descargado vuelve a local: la puerta de
 * IA no ofrece cambiar de modo y Ajustes queda detrás de ella, así que sin esta
 * auto-cura la app quedaba trabada en "Get Emma ready" con el modelo ya en disco.
 */

import { loadAiSettings, saveAiSettings } from "./remote-settings";
import { getSelectedLitertModelId, setSelectedLitertModelId } from "@/lib/litert-models";
import type { LitertModelId } from "@/lib/litert-models";

export interface AiReadiness {
  ready: boolean;
  mode: "local" | "hybrid" | "remote";
  reason: "ok" | "no-model" | "no-remote-key" | "no-bridge";
}

type EmmaApi = NonNullable<Window["emmaAPI"]>;

/**
 * ¿Hay un modelo local descargado? El motor usa el SELECCIONADO: si ese no está
 * en disco pero otro sí, reapunta la selección a uno descargado.
 */
async function hasLocalModel(api: EmmaApi): Promise<boolean> {
  const { models } = await api.litertModelsList();
  const downloaded = models.filter((m) => m.downloaded);
  if (!downloaded.length) return false;
  if (!downloaded.some((m) => m.id === getSelectedLitertModelId())) {
    setSelectedLitertModelId(downloaded[0].id as LitertModelId);
  }
  return true;
}

export async function checkAiReadiness(): Promise<AiReadiness> {
  const api = typeof window !== "undefined" ? window.emmaAPI : undefined;
  const settings = loadAiSettings();
  const { mode, provider } = settings;
  if (!api) return { ready: false, mode, reason: "no-bridge" };

  if (mode === "remote") {
    const status = await api.getAiKeyStatus();
    if (status[provider]) return { ready: true, mode, reason: "ok" };
    if (!(await hasLocalModel(api))) return { ready: false, mode, reason: "no-remote-key" };
    saveAiSettings({ ...settings, mode: "local" });
    return { ready: true, mode: "local", reason: "ok" };
  }

  if (await hasLocalModel(api)) return { ready: true, mode, reason: "ok" };

  // hybrid puede caer a la nube si hay key.
  if (mode === "hybrid") {
    const status = await api.getAiKeyStatus();
    if (status[provider]) return { ready: true, mode, reason: "ok" };
  }
  return { ready: false, mode, reason: "no-model" };
}
