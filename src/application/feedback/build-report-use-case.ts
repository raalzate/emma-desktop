/** buildFeedbackReport — convierte los errores silenciosos en feedback post-simulación. */

import type { ErrorLabel } from "@/domain/chat/error-taxonomy";
import type { SilentError } from "@/domain/chat/silent-error";
import { scenarioForError } from "@/domain/pathway/error-scenario-mapping";
import { LESSON_TIPS } from "@/domain/feedback/lesson-tips";
import {
  CHARACTER_COMMENTARY,
  HEADER_TEMPLATE,
  LESSON_HEADER,
  NO_ERRORS_TEMPLATE,
  PATTERN_HEADER,
  TABLE_HEADER,
  type SituationCharacter,
} from "@/domain/feedback/report-text";
import type { SessionMetric } from "@/domain/progression/session-metric";
import { titleCase } from "@/domain/shared/text-case";

/** Binding mínimo de la situación activa para el bloque de comentario. */
export interface FeedbackSituation {
  character: SituationCharacter;
  variantId: string;
}

/** Entradas del reporte: métrica + errores capturados + nivel (parte del contrato). */
export interface FeedbackReportInput {
  scenario: string;
  metric: SessionMetric;
  errors: SilentError[];
  level: string;
  situation?: FeedbackSituation;
  situationTitle?: string;
}

/** Counter.most_common: orden por conteo desc, empates por primera aparición. */
function mostCommon(errors: SilentError[]): [ErrorLabel, number][] {
  const counts = new Map<ErrorLabel, number>();
  for (const e of errors) counts.set(e.label, (counts.get(e.label) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function formatRow(idx: number, err: SilentError): string {
  const original = err.original.replaceAll("|", "\\|");
  const corrected = err.corrected.replaceAll("|", "\\|");
  return `| ${idx} | ${err.label} | ${original} | ${corrected} |\n`;
}

function formatPatterns(errors: SilentError[]): string {
  const lines = mostCommon(errors).map(([label, n]) => `- **${label}** — ${n} aparición(es)`);
  return PATTERN_HEADER + lines.join("\n") + "\n";
}

function formatLesson(errors: SilentError[]): string {
  const topTypes = mostCommon(errors)
    .slice(0, 2)
    .map(([label]) => label);
  const tips = topTypes
    .map((label) => `- **${label}**: ${LESSON_TIPS[label] ?? LESSON_TIPS.grammar}`)
    .join("\n");
  const drill =
    "Reescribe tus tres últimos mensajes aplicando la corrección " +
    "y léelos en voz alta dos veces.";
  let lesson = `${LESSON_HEADER}${tips}\n\n**Ejercicio:** ${drill}\n`;
  const scenario = topTypes.length > 0 ? scenarioForError(topTypes[0]) : null;
  if (scenario) {
    lesson += `\n**Escenario recomendado para practicar:** \`${scenario}\`\n`;
  }
  return lesson;
}

function formatSituation(binding: FeedbackSituation, title: string): string {
  const commentary = CHARACTER_COMMENTARY[binding.character] ?? "";
  return `\n### Situación activa\n**${title}** (variante \`${binding.variantId}\`)\n\n${commentary}\n`;
}

/** Mantiene errores cuya sugerencia difiere realmente del original. */
function isMeaningfulError(err: SilentError): boolean {
  return err.corrected.trim() !== err.original.trim();
}

/** Parte tras el primer punto del variantId (equivalente a split(".", 1)[-1]). */
function variantTitle(variantId: string): string {
  const idx = variantId.indexOf(".");
  return idx >= 0 ? variantId.slice(idx + 1) : variantId;
}

/** Construye el reporte de feedback en Markdown de una simulación terminada. */
export function buildFeedbackReport(input: FeedbackReportInput): string {
  const scenario = titleCase(input.scenario.replaceAll("_", " "));
  const title =
    input.situationTitle || (input.situation ? variantTitle(input.situation.variantId) : "");
  const situationBlock = input.situation ? formatSituation(input.situation, title) : "";

  // Filtra filas donde Suggested duplica Your wording — no son accionables y
  // sólo agregan ruido a la tabla de feedback.
  const errors = input.errors.filter(isMeaningfulError);
  if (errors.length === 0) {
    const head = NO_ERRORS_TEMPLATE.replace("{scenario}", scenario).replace(
      "{turns}",
      String(input.metric.turns),
    );
    return head + situationBlock;
  }

  const header = HEADER_TEMPLATE.replace("{scenario}", scenario)
    .replace("{turns}", String(input.metric.turns))
    .replace("{count}", String(errors.length));
  const parts = [header, TABLE_HEADER];
  errors.forEach((e, i) => parts.push(formatRow(i + 1, e)));
  parts.push(formatPatterns(errors));
  parts.push(formatLesson(errors));
  parts.push(situationBlock);
  return parts.join("");
}
