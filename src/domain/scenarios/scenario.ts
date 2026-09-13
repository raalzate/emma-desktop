/**
 * Escenario de role-play: dato puro del catálogo.
 *
 * El "why": EMMA arranca todo escenario a partir de estos campos (título,
 * rango CEFR y, sobre todo, el system prompt del rol). Es capa de dominio pura,
 * sin IO ni framework.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

// Tramo temático del catálogo: básico (A1→B1) vs avanzado (B2→C1). Permite
// filtrar y ordenar sin mirar el rango CEFR de cada escenario.
export type ScenarioTier = "basics" | "advanced";

export const SCENARIO_TIERS = ["basics", "advanced"] as const;

export interface Scenario {
  scenarioType: string;
  title: string;
  description: string;
  category: string;
  // Rango [mínimo, máximo] de niveles CEFR soportados (siempre contiguo).
  cefrRange: [CefrLevel, CefrLevel];
  emmaRole: string;
  roleSystemPrompt: string;
  tier: ScenarioTier;
}
