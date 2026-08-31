/**
 * Bloque compacto "LANGUAGE FOCUS" para el system prompt de simulación: ancla
 * la sesión a la unidad del libro que corresponde (chunks como objetivos a
 * usar, trampas a vigilar en silencio). Determinista: siempre los primeros N.
 */

import type { CurriculumUnit } from "@/domain/curriculum/unit";

const DEFAULT_MAX_CHUNKS = 6;
const DEFAULT_MAX_TRAPS = 4;

export interface BuildLanguageFocusOptions {
  maxChunks?: number;
  maxTraps?: number;
}

export function buildLanguageFocus(
  unit: CurriculumUnit,
  opts: BuildLanguageFocusOptions = {},
): string {
  const maxChunks = opts.maxChunks ?? DEFAULT_MAX_CHUNKS;
  const maxTraps = opts.maxTraps ?? DEFAULT_MAX_TRAPS;

  const chunkLines = unit.chunks
    .slice(0, maxChunks)
    .map((c) => `- ${c.text}`)
    .join("\n");
  const trapLines = unit.traps
    .slice(0, maxTraps)
    .map((t) => `- ${t.wrong} -> ${t.right}`)
    .join("\n");

  return (
    `LANGUAGE FOCUS (Unit ${unit.number}: ${unit.title})\n` +
    `Target chunks — create natural opportunities for the learner to use these:\n${chunkLines}\n` +
    `Traps to watch for (silent monitoring only — never correct them in conversation):\n${trapLines}`
  );
}

/**
 * Bloque compacto "TUTOR AWARENESS" para el system prompt: avisa a EMMA de las
 * categorías de error en las que el aprendiz es débil (fuera de esta unidad),
 * para que cree oportunidades naturales de practicarlas sin corregir
 * explícitamente ni romper el personaje. Vacío si no hay categorías débiles.
 */
export function buildTutorAwareness(weakCategories: string[]): string {
  if (weakCategories.length === 0) return "";
  return (
    `TUTOR AWARENESS\n` +
    `This learner is weak in: ${weakCategories.join(", ")}.\n` +
    `Without breaking character or giving explicit correction, create opportunities for them to practice these.`
  );
}
