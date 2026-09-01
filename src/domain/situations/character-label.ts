/**
 * Etiqueta legible del carácter de una situación.
 *
 * Es contenido de escena, no andamiaje: va en INGLÉS (Artículo 9). Vivía
 * duplicada en `scene-intro.tsx` y `scene-context.tsx`; dos copias significaban
 * dos verdades cuando alguien tocaba una sola. Dominio puro: un mapa y un lookup.
 */

import type { SituationCharacter } from "./situation-variant";

const CHARACTER_LABEL: Record<SituationCharacter, string> = {
  incident: "Incident",
  onboarding: "Onboarding",
  routine: "Routine",
  conflict: "Conflict",
};

/** Etiqueta en inglés del carácter de la situación. */
export function characterLabel(character: SituationCharacter): string {
  return CHARACTER_LABEL[character];
}
