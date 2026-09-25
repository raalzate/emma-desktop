/**
 * Revisión de una entrega de reto por EMMA: el LLM juzga cada criterio de la
 * rúbrica del libro, comenta en español (andamiaje, Artículo 9) y propone una
 * versión mejorada en inglés. La salida se valida con Zod en el borde: si el
 * modelo no devuelve JSON usable, el caso de uso devuelve null y la UI sigue
 * funcionando sin la opinión.
 */

import { z } from "zod";
import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { UnitChallenge } from "@/domain/curriculum/unit";

export interface ChallengeReview {
  criteriaMet: boolean[];
  commentEs: string;
  improved: string | null;
}

const REVIEW_SYSTEM_PROMPT =
  "You are EMMA, an English tutor for Spanish-speaking software engineers. " +
  "You review a learner's written delivery for a challenge against a rubric. " +
  "Judge each criterion honestly. Write the comment in Spanish (2-3 sentences, warm, concrete: " +
  "name what worked and the single most useful fix). Write the improved version in natural English, " +
  "keeping the learner's ideas and length. Reply ONLY with JSON: " +
  '{"criteria":[true,false,...],"commentEs":"...","improved":"..."}';

// `criteria` y `commentEs` son obligatorios: un `{}` no es una revisión, es
// un fallo del modelo, y pintarlo marcaría todos los criterios como no cumplidos.
const ReviewSchema = z.object({
  criteria: z.array(z.boolean()).min(1),
  commentEs: z.string().min(1),
  improved: z.string().optional(),
});

/** Extrae el primer objeto JSON de la respuesta, ignorando texto y fences. */
function extractJson(raw: string): unknown | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function buildPrompt(challenge: UnitChallenge, text: string): string {
  const rubric = challenge.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n");
  return (
    `Challenge instructions (Spanish): ${challenge.instructionsEs}\n` +
    `Rubric:\n${rubric}\n\n` +
    `Learner's delivery:\n"""\n${text}\n"""`
  );
}

export async function reviewChallenge({
  llm,
  challenge,
  text,
}: {
  llm: LlmGenerate;
  challenge: UnitChallenge;
  text: string;
}): Promise<ChallengeReview | null> {
  const raw = await llm({ prompt: buildPrompt(challenge, text), system: REVIEW_SYSTEM_PROMPT });
  const parsed = ReviewSchema.safeParse(extractJson(raw));
  if (!parsed.success) return null;

  const criteriaMet = challenge.criteria.map((_, i) => parsed.data.criteria[i] === true);
  const improved = parsed.data.improved?.trim() || null;
  return { criteriaMet, commentEs: parsed.data.commentEs.trim(), improved };
}
