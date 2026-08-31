/**
 * La lección REAL de Emma (BUG-001): tras la simulación, la tutora explica EN
 * INGLÉS HABLADO (directriz: la intervención de Emma siempre es en inglés y con
 * audio; la ayuda en español es un botón aparte) los errores capturados — por
 * qué están mal, la regla y ejemplos correctos — y cierra con un mini-reto. Si
 * el LLM falla o devuelve basura, retorna null y el resumen usa el respaldo.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import { isActionableCorrection, type SilentError } from "@/domain/chat/silent-error";
import { hasNonLatinScript } from "@/domain/chat/sanitize-reply";
import { LESSON_MAX_TOKENS } from "@/domain/shared/token-budgets";
import { unitForSession } from "@/domain/curriculum/unit-catalog";
import { relevantCommonErrors } from "@/domain/reference/common-error-catalog";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { isCefrLevel } from "@/domain/cefr/cefr-ladder";

const LESSON_SYSTEM =
  "You are EMMA, a warm English tutor for IT professionals. Write a short spoken " +
  "lesson in ENGLISH (4–7 sentences, adapted to the learner's CEFR level) about " +
  "their mistakes: for each one, explain in one line WHY it is wrong and the rule, " +
  "then give 1–2 correct example sentences in quotes. Close with one concrete " +
  "practice challenge. Encouraging tone, plain sentences that sound natural read " +
  "aloud — no headers, no lists, no markdown.";

const MAX_LESSON_CHARS = 1200;

export interface BuildLessonArgs {
  llm: LlmGenerate;
  errors: SilentError[];
  level: string;
  /** Escenario de la sesión: ancla la lección a las trampas de su unidad del libro. */
  scenarioType?: string;
}

const MAX_TRAP_HINTS = 4;

/**
 * Trampas de la unidad de la sesión (si hay escenario+nivel válido) + hasta 3
 * COMMON_ERRORS relevantes a los errores capturados: refuerzan la lección con
 * el material del libro sin cambiar el flujo si no vienen datos.
 */
function focusHint(errors: SilentError[], level: string, scenarioType: string | undefined): string {
  const unit =
    scenarioType && isCefrLevel(level) ? unitForSession(scenarioType, level as CefrLevel) : undefined;
  const trapLines = (unit?.traps ?? [])
    .slice(0, MAX_TRAP_HINTS)
    .map((t) => `- ${t.wrong} -> ${t.right}`);
  const commonErrorLines = relevantCommonErrors(errors).map((e) => `- ${e.wrong} -> ${e.right}`);
  const lines = [...trapLines, ...commonErrorLines];
  if (lines.length === 0) return "";
  return `\nRelated traps for this learner's level/scenario:\n${lines.join("\n")}`;
}

/** Valida en el borde: no vacía, tamaño razonable y escritura latina. */
function validLesson(raw: string): string | null {
  const text = raw.trim();
  if (!text || text.length > MAX_LESSON_CHARS || hasNonLatinScript(text)) return null;
  return text;
}

/** Lección hablada personalizada de Emma EN INGLÉS, o null (el caller usa el respaldo). */
export async function buildLesson(args: BuildLessonArgs): Promise<string | null> {
  const meaningful = args.errors.filter(isActionableCorrection);
  if (meaningful.length === 0) return null;
  const errorLines = meaningful
    .map((e) => `- (${e.label}) Dijo: "${e.original.trim()}" → Correcto: "${e.corrected.trim()}"`)
    .join("\n");
  const hint = focusHint(meaningful, args.level, args.scenarioType);
  try {
    const raw = await args.llm({
      prompt: `Learner CEFR level: ${args.level}\nSession mistakes:\n${errorLines}${hint}\n\nLesson:`,
      system: LESSON_SYSTEM,
      maxTokens: LESSON_MAX_TOKENS,
    });
    return validLesson(raw);
  } catch {
    return null;
  }
}
