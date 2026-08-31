"use client";

import { useMemo } from "react";
import { createLlmGenerate } from "@/lib/ai/llm-adapter";
import type { LlmGenerate } from "@/domain/ai/llm-port";

/**
 * Provee un `LlmGenerate` estable a los componentes. Los casos de uso del dominio
 * lo reciben inyectado; así la UI no conoce el motor (Gemma local o nube), sólo el
 * puerto. Respeta el modo global de IA (local/hybrid/remote) leído en el adaptador.
 */
export function useLlm(): LlmGenerate {
  return useMemo(() => createLlmGenerate(), []);
}
