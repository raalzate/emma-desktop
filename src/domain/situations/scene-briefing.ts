/**
 * Briefing de escena para el aprendiz (dominio puro).
 *
 * El `framingDescription` del catálogo está escrito como directivas en inglés
 * (insumo del LLM); mostrado crudo se lee como una "descripción", no como una
 * escena. Este módulo lo re-presenta: ambientación hipotética en español según
 * el carácter de la situación (Artículo 9: andamiaje en español) + la misión en
 * inglés partida en objetivos por oración (material de práctica: no se traduce).
 */

import { splitSentences } from "@/domain/chat/chat-brevity";
import type { SituationVariant, SituationCharacter } from "./situation-variant";

export interface SceneBriefing {
  /** Ambientación "imagina que..." en español, según el tono de la situación. */
  hypothetical: string;
  /** La misión en inglés, una oración por objetivo (vacío si no hay framing). */
  missionLines: string[];
}

const HYPOTHETICAL_BY_CHARACTER: Record<SituationCharacter, string> = {
  routine:
    "Imagina una jornada normal de trabajo: nada urgente en el aire, " +
    "pero el equipo cuenta contigo para que el día fluya.",
  incident:
    "Imagina que algo acaba de romperse y la presión sube: hay un incidente " +
    "en curso y todos miran cómo respondes.",
  conflict:
    "Imagina que hay fricción en el equipo: intereses cruzados, un desacuerdo " +
    "que te toca navegar con calma y claridad.",
  onboarding:
    "Imagina que alguien está aterrizando en el equipo y el primer contacto " +
    "marca la pauta: te toca dar contexto y generar confianza.",
};

/** Construye el briefing presentable de una situación del catálogo. */
export function buildSceneBriefing(situation: SituationVariant): SceneBriefing {
  return {
    hypothetical: HYPOTHETICAL_BY_CHARACTER[situation.character],
    missionLines: splitSentences(situation.framingDescription ?? ""),
  };
}
