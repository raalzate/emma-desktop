/**
 * Briefing inmersivo de escena, generado por la IA.
 *
 * La antesala estática ("Imagina una jornada normal…") es genérica; la inmersión
 * real necesita una mini-historia concreta y comportamental en español: qué está
 * pasando en el proyecto, qué está en juego y cuál es TU papel (p. ej. "el
 * proyecto lleva 3 días atrasado, el login falla y tú estás a cargo del cierre
 * de sesión"). Una llamada corta al LLM la redacta a partir del framing del
 * catálogo; si falla o devuelve basura, el caller usa el briefing estático.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import { personaFor } from "@/domain/personas/protopersona";
import { SCENE_BRIEFING_MAX_TOKENS } from "@/domain/shared/token-budgets";

const BRIEFING_SYSTEM =
  "You write immersive role-play scene briefings for an English-practice app. " +
  "Write in SPANISH, 2 to 4 short sentences, second person (segunda persona, " +
  "'tú'), present tense, addressed to the learner as the protagonist. Be " +
  "concrete and behavioral: invent specific plausible details consistent with " +
  "the scene facts (deadlines slipping by N days, a failing feature, a system " +
  "name from the learner's stack) and make clear what is at stake and what the " +
  "learner is responsible for. Mention the counterpart by name. No English " +
  "except technical terms. No lists, no headers, no quotes — just the narrative.";

export interface BuildBriefingArgs {
  llm: LlmGenerate;
  scenario: Scenario;
  situation: SituationVariant;
  techStack?: string;
  /** Hechos fijos del contrato de escena: la narrativa debe derivarse de ellos. */
  facts?: string;
}

export interface ImmersiveBriefing {
  /** Narrativa en español, o null si el LLM falló o devolvió basura. */
  narrative: string | null;
}

const MAX_NARRATIVE_CHARS = 600;

/** Valida en el borde la salida del LLM: no vacía y de largo razonable. */
function validNarrative(raw: string): string | null {
  const text = raw.trim();
  if (text.length === 0) return null;
  if (text.length > MAX_NARRATIVE_CHARS) return null;
  return text;
}

/** Genera la mini-historia inmersiva de la escena (null ⇒ usar fallback estático). */
export async function buildImmersiveBriefing(args: BuildBriefingArgs): Promise<ImmersiveBriefing> {
  const { llm, scenario, situation, techStack, facts } = args;
  const persona = personaFor(scenario.scenarioType, scenario.emmaRole);
  const prompt =
    `Scene: ${scenario.title} — ${scenario.description}\n` +
    `Situation: ${situation.title} — ${situation.framingDescription}\n` +
    `Counterpart: ${persona.name}, ${persona.role}.\n` +
    (techStack ? `Learner's stack: ${techStack}.\n` : "") +
    (facts ? `Fixed scene facts (use them, do not contradict):\n${facts}\n` : "") +
    "Briefing (español):";
  try {
    const raw = await llm({
      prompt,
      system: BRIEFING_SYSTEM,
      maxTokens: SCENE_BRIEFING_MAX_TOKENS,
    });
    return { narrative: validNarrative(raw) };
  } catch {
    return { narrative: null };
  }
}
