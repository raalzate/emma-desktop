"use client";

/**
 * Estado del gestor de modelos locales (LiteRT). Carga el catálogo desde el
 * proceso main, se suscribe al progreso de descarga en vivo y expone acciones
 * (descargar/eliminar/revelar). La selección del modelo activo se persiste en
 * localStorage vía litert-models.
 */

import { useCallback, useEffect, useState } from "react";
import type { LitertModelStatus } from "@/types/emma-api";
import {
  getSelectedLitertModelId, setSelectedLitertModelId, type LitertModelId,
} from "@/lib/litert-models";
import { getEmmaApi } from "./emma-api";

export interface LitertModelsState {
  models: LitertModelStatus[];
  totalRamGB: number;
  loading: boolean;
  progress: Record<string, number>;
  selectedId: string;
  available: boolean;
}

/** Hook que orquesta la lista de modelos y sus acciones. */
export function useLitertModels() {
  const api = getEmmaApi();
  const [state, setState] = useState<LitertModelsState>({
    models: [], totalRamGB: 0, loading: true, progress: {},
    selectedId: getSelectedLitertModelId(), available: !!api,
  });

  const reload = useCallback(async () => {
    if (!api) return setState((s) => ({ ...s, loading: false, available: false }));
    const { models, totalRamGB } = await api.litertModelsList();
    setState((s) => ({ ...s, models, totalRamGB, loading: false, available: true }));
  }, [api]);

  useEffect(() => {
    void reload();
    if (!api) return;
    return api.onLitertModelProgress(({ id, percent }) =>
      setState((s) => ({ ...s, progress: { ...s.progress, [id]: percent } })),
    );
  }, [api, reload]);

  const download = useCallback(async (id: string) => {
    if (!api) return { ok: false };
    const res = await api.litertModelDownload(id);
    await reload();
    return res;
  }, [api, reload]);

  const remove = useCallback(async (id: string) => {
    if (!api) return;
    await api.litertModelDelete(id);
    await reload();
  }, [api, reload]);

  const reveal = useCallback((id: string) => api?.litertModelReveal(id), [api]);

  const select = useCallback((id: string) => {
    setSelectedLitertModelId(id as LitertModelId);
    setState((s) => ({ ...s, selectedId: id }));
  }, []);

  return { ...state, download, remove, reveal, select };
}
