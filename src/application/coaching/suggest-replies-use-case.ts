/**
 * Genera 3 sugerencias de respuesta escalonadas a partir del último turno de
 * EMMA. Orquestación pura: construye el prompt de dominio, llama al LLM por el
 * puerto inyectado y parsea de forma lenient. No toca React/Electron/IO.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { REPLIES_MAX_TOKENS } from "@/domain/shared/token-budgets";
import { isNonEmptyString, parseRawArray } from "@/domain/coaching/parse-json-array";
import {
  buildSuggestRepliesPrompt,
  isEchoOfAgent,
  LEVEL_HINTS,
  SUGGEST_REPLIES_ANSWER_RULES,
  SUGGEST_REPLIES_SYSTEM_PROMPT,
  SUGGEST_REPLIES_WITH_DRAFT_APPENDIX,
  type ReplySuggestion,
} from "@/domain/coaching/reply-suggestion";
import { unitForSession } from "@/domain/curriculum/unit-catalog";
import { situationForScenario } from "@/domain/curriculum/scenario-situation-map";
import { phrasesForSituation } from "@/domain/reference/phrase-bank-catalog";
import { rankByRelevance } from "@/domain/coaching/suggestion-context";

const MAX_FOCUS_CHUNKS = 3;
const MAX_FOCUS_PHRASES = 3;

/**
 * Chunks de la unidad de la sesión + frases del banco, elegidos por RELEVANCIA
 * contra lo que la persona acaba de decir.
 *
 * Antes era un `slice(0, 4)` del catálogo: salían siempre las mismas frases de
 * la unidad, sin relación con la pregunta en curso, y competían con el contexto
 * real de la escena. Retrocompatible: sin scenarioType (o sin unidad/situación
 * asociada) es "".
 */
function sessionFocusHint(
  scenarioType: string | undefined,
  level: CefrLevel,
  context: string,
): string {
  if (!scenarioType) return "";
  const unit = unitForSession(scenarioType, level);
  const chunks = rankByRelevance(
    unit?.chunks.map((c) => c.text) ?? [],
    context,
    MAX_FOCUS_CHUNKS,
  );
  const situation = situationForScenario(scenarioType);
  const phrases = rankByRelevance(
    phrasesForSituation(situation).map((p) => p.phrase),
    context,
    MAX_FOCUS_PHRASES,
  );
  const lines = [...chunks, ...phrases];
  if (lines.length === 0) return "";
  return `Useful phrases for this session:\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

// Se recorta a 3 ANTES de filtrar (como el original): el índice del array
// mapea al level_hint, así un item inválido salta su hint en vez de recorrerlo.
function parseSuggestions(raw: string): ReplySuggestion[] {
  return parseRawArray(raw)
    .slice(0, LEVEL_HINTS.length)
    .map((item, i) =>
      isNonEmptyString(item)
        ? { text: item.trim(), levelHint: LEVEL_HINTS[i] }
        : null,
    )
    .filter((s): s is ReplySuggestion => s !== null);
}

export async function suggestReplies(args: {
  llm: LlmGenerate;
  context: string;
  level: CefrLevel;
  draft?: string;
  /** Escenario de la sesión activa: ancla las sugerencias a su unidad del libro. */
  scenarioType?: string;
  /**
   * Sólo la última línea del agente, para el filtro anti-eco. Va aparte de
   * `context` a propósito: desde que el contexto incluye la escena y lo que el
   * aprendiz ya dijo, medir el eco contra TODO descartaba sugerencias buenas
   * por solaparse con las palabras del propio aprendiz.
   */
  agentLine?: string;
}): Promise<ReplySuggestion[]> {
  const hasDraft = Boolean(args.draft?.trim());
  const base = SUGGEST_REPLIES_SYSTEM_PROMPT + SUGGEST_REPLIES_ANSWER_RULES;
  const system = hasDraft ? base + SUGGEST_REPLIES_WITH_DRAFT_APPENDIX : base;
  const focusHint = sessionFocusHint(args.scenarioType, args.level, args.context);
  const prompt = buildSuggestRepliesPrompt(args.context, args.level, args.draft);
  const raw = await args.llm({
    prompt: focusHint ? `${prompt}\n${focusHint}` : prompt,
    system,
    maxTokens: REPLIES_MAX_TOKENS,
  });
  // El filtro anti-eco descarta chips que solo repiten al agente (BUG-001).
  const agentLine = args.agentLine ?? args.context;
  return parseSuggestions(raw).filter((s) => !isEchoOfAgent(s.text, agentLine));
}
