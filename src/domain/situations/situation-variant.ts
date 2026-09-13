/**
 * SituationVariant — un encuadre concreto de un escenario de práctica.
 *
 * El "why": cada escenario tiene varias "situaciones" (p. ej. un standup rutinario
 * vs. uno en plena incidencia). El character marca el tono/urgencia y alimenta el
 * feedback post-sesión. Dato puro, sin IO.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

// Tono/urgencia de la variante, como unión de literales (sin enum: se serializa).
export type SituationCharacter = "incident" | "onboarding" | "routine" | "conflict";

export const SITUATION_CHARACTERS = ["incident", "onboarding", "routine", "conflict"] as const;

export interface SituationVariant {
  id: string;
  scenarioType: string;
  title: string;
  framingDescription: string;
  character: SituationCharacter;
  cefrLevels: CefrLevel[];
  stackHints: string[];
  retired: boolean;
}
