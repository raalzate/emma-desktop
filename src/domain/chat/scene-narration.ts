/**
 * La escena contada como narración, no como ficha.
 *
 * El "why": la escena se presentaba en una tarjeta estática al tope del chat —
 * un bloque de datos que el aprendiz saltaba con la vista y que rompía la
 * ilusión antes de empezar. Un videojuego no muestra una ficha: te NARRA dónde
 * estás, con quién hablás y qué tenés que lograr, un compás a la vez. Aquí se
 * decide QUÉ se narra y en qué orden; el tecleo es cosa de la UI.
 *
 * Todo el texto va en INGLÉS: es la ficción que el aprendiz habita, no
 * andamiaje de producto (Artículo 9). Dominio puro.
 */

import { buildSceneBriefing } from "@/domain/situations/scene-briefing";
import type { SituationVariant } from "@/domain/situations/situation-variant";

/** Clase de compás: dónde estás, con quién hablás, qué tenés que lograr. */
export type NarrationKind = "setting" | "character" | "mission";

export interface NarrationBeat {
  kind: NarrationKind;
  /** Texto en inglés que la UI teclea. */
  text: string;
}

export interface SceneNarrationArgs {
  scenarioTitle: string;
  scenarioDescription: string;
  situation: SituationVariant | null | undefined;
  personaName: string;
  personaRole: string;
}

/** Encabezado de la escena: escenario y, si la hay, la situación concreta. */
function headline(scenarioTitle: string, situation: SituationVariant | null | undefined): string {
  const title = situation?.title?.trim();
  return title ? `${scenarioTitle} — ${title}.` : scenarioTitle;
}

export function buildSceneNarration(args: SceneNarrationArgs): NarrationBeat[] {
  const { scenarioTitle, scenarioDescription, situation, personaName, personaRole } = args;
  const briefing = situation ? buildSceneBriefing(situation) : null;
  const beats: NarrationBeat[] = [
    { kind: "setting", text: headline(scenarioTitle, situation) },
    { kind: "setting", text: briefing?.hypothetical ?? scenarioDescription },
    { kind: "character", text: `You're talking with ${personaName}, your ${personaRole}.` },
    ...(briefing?.missionLines ?? []).map(
      (line): NarrationBeat => ({ kind: "mission", text: line }),
    ),
  ];
  // Un compás vacío pintaría una burbuja en blanco; uno repetido (la descripción
  // del escenario es su propio título) narra dos veces lo mismo.
  const seen = new Set<string>();
  return beats.reduce<NarrationBeat[]>((kept, beat) => {
    const text = beat.text.trim();
    if (text.length === 0 || seen.has(text)) return kept;
    seen.add(text);
    return [...kept, { ...beat, text }];
  }, []);
}
