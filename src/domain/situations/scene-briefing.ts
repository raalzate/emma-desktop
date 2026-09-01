/**
 * Briefing de escena para el aprendiz (dominio puro).
 *
 * El `framingDescription` del catálogo está escrito como directivas en inglés
 * (insumo del LLM); mostrado crudo se lee como una "descripción", no como una
 * escena. Este módulo lo re-presenta: ambientación hipotética según el carácter
 * de la situación + la misión partida en objetivos por oración. Todo en INGLÉS:
 * es la ficción que el aprendiz habita, no andamiaje de producto (Artículo 9).
 */

import { splitSentences } from "@/domain/chat/chat-brevity";
import type { SituationVariant, SituationCharacter } from "./situation-variant";

export interface SceneBriefing {
  /** Ambientación "picture that..." en inglés, según el tono de la situación. */
  hypothetical: string;
  /** La misión en inglés, una oración por objetivo (vacío si no hay framing). */
  missionLines: string[];
}

const HYPOTHETICAL_BY_CHARACTER: Record<SituationCharacter, string> = {
  routine:
    "Picture an ordinary workday: nothing urgent in the air, " +
    "but your team counts on you to keep things moving.",
  incident:
    "Picture something breaking right now and the pressure rising: an incident " +
    "is live and everyone is watching how you respond.",
  conflict:
    "Picture friction inside the team: competing interests and a disagreement " +
    "you have to steer through calmly and clearly.",
  onboarding:
    "Picture someone landing on the team, where first contact sets the tone: " +
    "it is on you to give context and build trust.",
};

/** Construye el briefing presentable de una situación del catálogo. */
export function buildSceneBriefing(situation: SituationVariant): SceneBriefing {
  return {
    hypothetical: HYPOTHETICAL_BY_CHARACTER[situation.character],
    missionLines: splitSentences(situation.framingDescription ?? ""),
  };
}
