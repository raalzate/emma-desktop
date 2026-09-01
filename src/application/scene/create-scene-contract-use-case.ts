/**
 * Contrato de escena (BUG-001): la única fuente de verdad de los hechos del
 * escenario, generada ANTES del kickoff. Alimenta AMBOS lados: los SCENE FACTS
 * fijos del system prompt de la persona (guardrail) y la narrativa en inglés
 * que lee el aprendiz en la antesala — así los dos ven el mismo mundo. Si el
 * LLM falla o devuelve basura, el framing del catálogo es el contrato
 * determinista de respaldo (el botón de comenzar nunca queda bloqueado).
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import { hasNonLatinScript } from "@/domain/chat/sanitize-reply";
import { SCENE_BRIEFING_MAX_TOKENS } from "@/domain/shared/token-budgets";
import { buildImmersiveBriefing } from "./build-scene-briefing-use-case";

const FACTS_SYSTEM =
  "You define the FIXED facts of a realistic workplace case for a role-play scene. " +
  "Return exactly 4 short lines in ENGLISH, no bullets, no numbering, no commentary: " +
  "(1) the project/system and team — invent a plausible name using the learner's " +
  "stack if given (e.g. 'Atlas checkout API, squad of 5, sprint 14'); " +
  "(2) what happened YESTERDAY, concrete (a merge, a bug, a review finding); " +
  "(3) what is at stake TODAY (a demo, a deadline, a dependency) with a time or date; " +
  "(4) the complication in play (the risk, blocker or tension of this case). " +
  "Each line under 16 words, with specific names and numbers — a real case, not generic.";

export interface SceneContract {
  /** Hechos fijos en inglés (guardrail del system prompt). */
  facts: string;
  /** Narrativa en inglés para la antesala, o null si el LLM falló. */
  narrative: string | null;
}

export interface CreateSceneContractArgs {
  llm: LlmGenerate;
  scenario: Scenario;
  situation: SituationVariant;
  techStack?: string;
}

/** Valida en el borde los hechos del LLM: 1–4 líneas cortas, latinas, sin listas. */
function validFacts(raw: string): string | null {
  const text = raw.trim();
  if (!text || hasNonLatinScript(text)) return null;
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
  if (lines.length === 0 || lines.length > 5) return null;
  if (lines.some((l) => l.length < 3 || l.length > 120)) return null;
  return lines.join("\n");
}

/** Genera el contrato de escena: hechos EN (guardrail) + narrativa EN derivada. */
export async function createSceneContract(args: CreateSceneContractArgs): Promise<SceneContract> {
  const { llm, scenario, situation, techStack } = args;
  let facts = situation.framingDescription;
  let generated = false;
  try {
    const raw = await llm({
      prompt:
        `Scene: ${scenario.title} — ${scenario.description}\n` +
        `Situation: ${situation.title} — ${situation.framingDescription}\n` +
        (techStack ? `Learner's stack: ${techStack}.\n` : "") +
        "Facts:",
      system: FACTS_SYSTEM,
      maxTokens: SCENE_BRIEFING_MAX_TOKENS,
    });
    const valid = validFacts(raw);
    if (valid) {
      facts = valid;
      generated = true;
    }
  } catch {
    // contrato determinista de respaldo (framing) + sin narrativa
    return { facts, narrative: null };
  }
  // La narrativa se redacta DESDE los hechos: mismo contrato en ambos lados.
  const { narrative } = await buildImmersiveBriefing({
    llm,
    scenario,
    situation,
    techStack,
    facts: generated ? facts : undefined,
  });
  return { facts, narrative };
}
