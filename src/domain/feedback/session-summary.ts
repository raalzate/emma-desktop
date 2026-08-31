/**
 * Resumen de sesión rediseñado (BUG-001): markdown en español, por secciones y
 * sin tablas (el dialog las renderizaba rotas). La lección viene del tutor
 * (LLM) o, como respaldo determinista, del consejo del tipo de error dominante.
 * Dominio puro: solo texto.
 */

import type { ErrorLabel } from "@/domain/chat/error-taxonomy";
import type { SilentError } from "@/domain/chat/silent-error";
import { LESSON_TIPS } from "@/domain/feedback/lesson-tips";
import { scenarioForError } from "@/domain/pathway/error-scenario-mapping";
import { titleCase } from "@/domain/shared/text-case";

export interface SessionSummaryInput {
  scenarioTitle: string;
  situationTitle?: string;
  level: string;
  turns: number;
  errors: SilentError[];
  /** Lección personalizada del tutor (LLM), o null para usar el respaldo. */
  lesson: string | null;
}

/** Tipo de error más frecuente (empates: primera aparición). */
function dominantLabel(errors: SilentError[]): ErrorLabel | null {
  const counts = new Map<ErrorLabel, number>();
  for (const e of errors) counts.set(e.label, (counts.get(e.label) ?? 0) + 1);
  let best: ErrorLabel | null = null;
  let max = 0;
  for (const [label, n] of counts) {
    if (n > max) {
      best = label;
      max = n;
    }
  }
  return best;
}

function correctionsSection(errors: SilentError[]): string {
  // Una línea por corrección: los saltos suaves de markdown se renderizan
  // como espacio, así que el par original→mejora va inline.
  const items = errors
    .map((e, i) => `${i + 1}. “${e.original.trim()}” → **“${e.corrected.trim()}”** _(${e.label})_`)
    .join("\n");
  return `### ✏️ Tus correcciones\n\n${items}\n`;
}

function lessonSection(errors: SilentError[], lesson: string | null): string {
  if (lesson) return `### 📚 Lección de Emma\n${lesson.trim()}\n`;
  const label = dominantLabel(errors);
  const tip = label ? (LESSON_TIPS[label] ?? LESSON_TIPS.grammar) : LESSON_TIPS.grammar;
  const drill =
    "Reto: reescribe tus tres últimos mensajes aplicando la corrección y léelos en voz alta dos veces.";
  return `### 📚 Lección de Emma\n${label ? `**${label}** — ` : ""}${tip}\n\n${drill}\n`;
}

function nextStepSection(errors: SilentError[], level: string): string {
  const label = dominantLabel(errors);
  const scenario = label ? scenarioForError(label) : null;
  const practice = scenario
    ? `Práctica recomendada: **${titleCase(scenario.replaceAll("_", " "))}**.`
    : "Sigue con el siguiente escenario de tu ruta.";
  return `### 🎯 Siguiente paso\n${practice} Nivel actual: **${level}**.\n`;
}

/** Compone el resumen completo de la sesión en markdown (español). */
export function composeSessionSummary(input: SessionSummaryInput): string {
  const { scenarioTitle, situationTitle, level, turns, errors, lesson } = input;
  const scene = situationTitle ? `${scenarioTitle} · ${situationTitle}` : scenarioTitle;
  const header =
    `## 🏁 ${scene} — sesión completada\n` +
    `**Nivel:** ${level} · **Turnos:** ${turns} · **Correcciones:** ${errors.length}\n`;
  if (errors.length === 0) {
    return (
      header +
      `\n¡Excelente! Terminaste la escena **sin correcciones**. ` +
      `Tu inglés fluyó natural durante toda la conversación.\n\n` +
      nextStepSection(errors, level)
    );
  }
  return [header, correctionsSection(errors), lessonSection(errors, lesson), nextStepSection(errors, level)].join("\n");
}
