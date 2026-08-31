/**
 * Constructores de los prompts focalizados — uno pequeño y de propósito único
 * por sección (pronunciación, gramática, respuestas).
 *
 * El LLM local es pequeño, así que cada sección es una llamada estrecha que
 * devuelve una forma simple y parseable; el Markdown final se ensambla en código
 * (ver teaching-markdown.ts). No hay un prompt gigante multi-sección.
 */

import type { ContextTurn, TeachingRequest } from "@/domain/english-teacher/teaching-models";
import {
  GRAMMAR_SYSTEM,
  PHONETICS_SYSTEM,
  repliesSystem,
} from "@/domain/english-teacher/teaching-prompt-text";

/** Par (system, user) que alimenta al puerto LLM (prompt = user). */
export interface PromptPair {
  system: string;
  user: string;
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  zh: "Mandarin Chinese",
};

const ROLE_LABELS: Record<string, string> = { user: "Learner", assistant: "Emma" };

export function resolveLanguageName(code: string): string {
  return LANG_NAMES[code] ?? "English";
}

function formatHistory(history: ContextTurn[]): string {
  const lines: string[] = [];
  for (const turn of history) {
    const rawRole = turn.role ?? "";
    const role = ROLE_LABELS[rawRole] ?? rawRole;
    const content = (turn.content ?? "").trim();
    if (content) {
      lines.push(`${role}: ${content}`);
    }
  }
  return lines.join("\n") || "(no prior turns)";
}

/** Identifica las 2-4 estructuras gramaticales principales del texto completo. */
export function grammarPrompt(text: string): PromptPair {
  return { system: GRAMMAR_SYSTEM, user: `Text:\n${text}` };
}

/** Respelling al estilo español + traducción, una fila por frase. */
export function phoneticsPrompt(phrases: string[]): PromptPair {
  return { system: PHONETICS_SYSTEM, user: "Frases:\n" + phrases.join("\n") };
}

/** 3 respuestas alternativas a través de registros; nota en `langName`. */
export function repliesPrompt(request: TeachingRequest, langName: string): PromptPair {
  const user =
    `Emma said:\n${request.text}\n\nRecent conversation (context only):\n` +
    formatHistory(request.contextHistory);
  return { system: repliesSystem(langName), user };
}
