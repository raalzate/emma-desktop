"use client";

/**
 * Estado del updater para cualquier vista (#383). Antes sólo la tarjeta de
 * Ajustes escuchaba `update-status`, y el chequeo de arranque (15 s) llegaba
 * cuando no estaba montada: nadie se enteraba de la versión nueva. Al montar
 * se pide el último estado al main y después se sigue escuchando. Todo lo que
 * llega se valida con la guarda de dominio.
 */

import { useEffect, useState } from "react";
import { parseUpdateStatus, type UpdateStatus } from "@/domain/updates/update-status";
import { getEmmaApi } from "./emma-api";

export function useUpdateStatus(): UpdateStatus | null {
  const [status, setStatus] = useState<UpdateStatus | null>(null);

  useEffect(() => {
    const api = getEmmaApi();
    if (!api) return;
    let live = false;
    const off = api.onUpdateStatus((raw) => {
      const parsed = parseUpdateStatus(raw);
      if (!parsed) return;
      live = true;
      setStatus(parsed);
    });
    void api
      .updatesLastStatus?.()
      .then((raw) => {
        const parsed = parseUpdateStatus(raw);
        // Un evento en vivo es más nuevo que el guardado.
        if (parsed && !live) setStatus(parsed);
      })
      .catch(() => {});
    return off;
  }, []);

  return status;
}
