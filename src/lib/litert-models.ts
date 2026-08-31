/**
 * @fileOverview Catálogo de modelos LiteRT-LM (.litertlm) — DATOS PUROS.
 *
 * Compartido entre renderer (Ajustes, selección) y main (descarga/servido). La
 * inferencia corre en el renderer con `@litert-lm/core` (WebGPU); el archivo se
 * sirve localmente vía el protocolo `litert-model://`.
 *
 * EMMA hereda del instalador original la elección por RAM (E2B liviano / E4B
 * calidad). Sin React ni APIs de Node: solo el catálogo y la selección persistida.
 */

export type LitertModelId = "gemma-e2b" | "gemma-e4b";

export interface LitertModelMeta {
  id: LitertModelId;
  label: string;
  /** Nombre de archivo local (en userData/models/litert). */
  file: string;
  /** URL de descarga (HuggingFace, litert-community). */
  url: string;
  /** Tamaño aproximado de la descarga, en GB. */
  approxGB: number;
  /** RAM mínima recomendada (GB) para elegir por defecto según el equipo. */
  minRamGB: number;
  blurb: string;
}

export const LITERT_MODELS: LitertModelMeta[] = [
  {
    id: "gemma-e2b",
    label: "Gemma 4 · E2B",
    file: "gemma-4-E2B-it-web.litertlm",
    url: "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.litertlm",
    approxGB: 2.0,
    minRamGB: 8,
    blurb: "Más liviano y rápido. Buena opción por defecto en equipos con poca VRAM.",
  },
  {
    id: "gemma-e4b",
    label: "Gemma 4 · E4B",
    file: "gemma-4-E4B-it-web.litertlm",
    url: "https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it-web.litertlm",
    approxGB: 3.0,
    minRamGB: 16,
    blurb: "Máxima calidad conversacional/pedagógica. Requiere GPU/VRAM más holgada.",
  },
];

// E4B por defecto (BUG-001): el E2B rompe personaje con prompts de rol largos.
export const DEFAULT_LITERT_MODEL_ID: LitertModelId = "gemma-e4b";
export const LITERT_MODEL_STORAGE = "litert_model";

export function getLitertModelMeta(id: string | undefined | null): LitertModelMeta {
  return (
    LITERT_MODELS.find((m) => m.id === id) ??
    LITERT_MODELS.find((m) => m.id === DEFAULT_LITERT_MODEL_ID)!
  );
}

/** Sugiere el modelo por defecto según la RAM total del equipo (GB). */
export function suggestModelForRam(totalRamGB: number): LitertModelId {
  const best = [...LITERT_MODELS]
    .filter((m) => totalRamGB >= m.minRamGB)
    .sort((a, b) => b.minRamGB - a.minRamGB)[0];
  return (best ?? LITERT_MODELS[0]).id;
}

export function getSelectedLitertModelId(): LitertModelId {
  try {
    const v = localStorage?.getItem?.(LITERT_MODEL_STORAGE) as LitertModelId | null;
    return LITERT_MODELS.some((m) => m.id === v) ? (v as LitertModelId) : DEFAULT_LITERT_MODEL_ID;
  } catch {
    return DEFAULT_LITERT_MODEL_ID;
  }
}

export function setSelectedLitertModelId(id: LitertModelId): void {
  try {
    localStorage.setItem(LITERT_MODEL_STORAGE, id);
  } catch {
    /* ignore */
  }
}

/** Nombre de archivo del modelo seleccionado (lo usan el motor y las tareas). */
export function getSelectedLitertModelFile(): string {
  return getLitertModelMeta(getSelectedLitertModelId()).file;
}
