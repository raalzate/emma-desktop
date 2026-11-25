/**
 * Precalentar el modelo local al abrir la app (T16 de #323).
 *
 * El "why": la primera generación carga el modelo (medido: 123 s para los
 * hechos de la primera escena del día). Una generación mínima en segundo plano
 * lo carga mientras el aprendiz mira el mapa; como es "background", cualquier
 * generación interactiva la interrumpe y nada espera detrás de ella.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { AiMode } from "./remote-settings";

export async function prewarmLocalModel(llm: LlmGenerate, mode: AiMode): Promise<void> {
  if (mode === "remote") return;
  try {
    await llm({ prompt: "Reply with OK.", maxTokens: 4, priority: "background", tag: "prewarm" });
  } catch {
    /* preemptada o sin motor: la primera generación real cargará el modelo */
  }
}
