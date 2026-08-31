/** Acceso seguro al puente preload (undefined en SSR/dev sin Electron). */

import type { EmmaApi } from "@/types/emma-api";

/** Devuelve window.emmaAPI si existe; si no, undefined (evita romper en SSR). */
export function getEmmaApi(): EmmaApi | undefined {
  if (typeof window === "undefined") return undefined;
  return window.emmaAPI;
}
