/**
 * ¿Está la IA lista para inferir? EMMA necesita un motor real antes de conversar:
 *  - modo local/hybrid → al menos un modelo Gemma (.litertlm) descargado;
 *  - modo remote → una API key configurada para el proveedor elegido.
 * Sin esto, cualquier llamada al LLM fallaría ("Failed to fetch") — así que la UI
 * primero pide descargar el modelo.
 */

import { loadAiSettings } from "./remote-settings";
import { getSelectedLitertModelId, setSelectedLitertModelId } from "@/lib/litert-models";
import type { LitertModelId } from "@/lib/litert-models";

export interface AiReadiness {
  ready: boolean;
  mode: "local" | "hybrid" | "remote";
  reason: "ok" | "no-model" | "no-remote-key" | "no-bridge";
}

export async function checkAiReadiness(): Promise<AiReadiness> {
  const api = typeof window !== "undefined" ? window.emmaAPI : undefined;
  const { mode, provider } = loadAiSettings();
  if (!api) return { ready: false, mode, reason: "no-bridge" };

  if (mode === "remote") {
    const status = await api.getAiKeyStatus();
    return status[provider]
      ? { ready: true, mode, reason: "ok" }
      : { ready: false, mode, reason: "no-remote-key" };
  }

  // local / hybrid → hace falta un modelo descargado. Además, el motor usa el
  // modelo SELECCIONADO: si el seleccionado no está descargado pero otro sí,
  // reapuntamos la selección a uno descargado (auto-cura la incoherencia).
  const { models } = await api.litertModelsList();
  const downloaded = models.filter((m) => m.downloaded);
  if (downloaded.length) {
    const selected = getSelectedLitertModelId();
    if (!downloaded.some((m) => m.id === selected)) {
      setSelectedLitertModelId(downloaded[0].id as LitertModelId);
    }
    return { ready: true, mode, reason: "ok" };
  }

  // hybrid puede caer a la nube si hay key.
  if (mode === "hybrid") {
    const status = await api.getAiKeyStatus();
    if (status[provider]) return { ready: true, mode, reason: "ok" };
  }
  return { ready: false, mode, reason: "no-model" };
}
