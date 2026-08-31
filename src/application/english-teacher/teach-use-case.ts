/**
 * Caso de uso "Teach me": cadena de 3 llamadas focalizadas ensamblada en código.
 *
 * (1) tabla de pronunciación = frases segmentadas en código + respelling español
 *     + traducción vía el prompt de fonética;
 * (2) estructuras gramaticales explicadas EN ESPAÑOL vía el prompt de gramática;
 * (3) sugerencias de respuesta a través de registros vía el prompt de respuestas.
 * Cada llamada respeta su propio presupuesto de tokens; el resultado se cachea.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import {
  GRAMMAR_MAX_TOKENS,
  PHONETICS_MAX_TOKENS,
  REPLIES_MAX_TOKENS,
} from "@/domain/shared/token-budgets";
import { assembleTeaching } from "@/domain/english-teacher/teaching-markdown";
import type {
  ProgressCallback,
  PronunciationRow,
  TeachingRequest,
  TeachingResult,
} from "@/domain/english-teacher/teaching-models";
import {
  parseGrammarPoints,
  parsePhonetics,
  parseReplies,
} from "@/domain/english-teacher/teaching-parsers";
import {
  grammarPrompt,
  phoneticsPrompt,
  repliesPrompt,
  resolveLanguageName,
  type PromptPair,
} from "@/domain/english-teacher/teaching-prompt";
import { segmentForPronunciation } from "@/domain/english-teacher/text-segmentation";
import { readCache, writeCache } from "@/application/english-teacher/teach-cache";
import {
  errorResult,
  successResult,
  type Sections,
} from "@/application/english-teacher/teach-result";

export interface TeachArgs {
  llm: LlmGenerate;
  text: string;
  responseId: string;
  userId: number;
  explainLanguage?: string;
  contextHistory?: TeachingRequest["contextHistory"];
  onProgress?: ProgressCallback;
}

export async function teach(args: TeachArgs): Promise<TeachingResult> {
  const request = buildRequest(args);
  const cached = readCache(request);
  if (cached) {
    return cached;
  }
  const result = await runChain(args.llm, request, args.onProgress);
  if (result.status === "success") {
    writeCache(request, result);
  }
  return result;
}

function buildRequest(args: TeachArgs): TeachingRequest {
  if (!args.text) {
    throw new Error("text must not be empty");
  }
  if (args.userId <= 0) {
    throw new Error("user_id must be a positive integer");
  }
  return {
    text: args.text,
    responseId: args.responseId,
    userId: args.userId,
    explainLanguage: args.explainLanguage ?? "en",
    contextHistory: args.contextHistory ?? [],
  };
}

async function runChain(
  llm: LlmGenerate,
  request: TeachingRequest,
  onProgress?: ProgressCallback,
): Promise<TeachingResult> {
  const start = Date.now();
  try {
    const sections = await generateSections(llm, request, onProgress);
    return successResult(request, sections, start);
  } catch {
    // Una llamada de sección falló → resultado de error (igual que el servicio Python).
    return errorResult(request, start);
  }
}

async function generateSections(
  llm: LlmGenerate,
  request: TeachingRequest,
  onProgress?: ProgressCallback,
): Promise<Sections> {
  const lang = resolveLanguageName(request.explainLanguage);
  const phrases = segmentForPronunciation(request.text);
  let phonetics: PronunciationRow[] = [];
  if (phrases.length > 0) {
    phonetics = parsePhonetics(await gen(llm, phoneticsPrompt(phrases), PHONETICS_MAX_TOKENS));
    await emit(onProgress, { phonetics });
  }
  const grammar = parseGrammarPoints(await gen(llm, grammarPrompt(request.text), GRAMMAR_MAX_TOKENS));
  await emit(onProgress, { phonetics, grammar });
  const replies = parseReplies(await gen(llm, repliesPrompt(request, lang), REPLIES_MAX_TOKENS));
  await emit(onProgress, { phonetics, grammar, replies }); // 3er bloque: sugerencias
  return { phonetics, grammar, replies };
}

function gen(llm: LlmGenerate, prompt: PromptPair, maxTokens: number): Promise<string> {
  return llm({ prompt: prompt.user, system: prompt.system, maxTokens });
}

/** Empuja el Markdown acumulado de las secciones producidas hasta ahora. */
async function emit(
  onProgress: ProgressCallback | undefined,
  sections: Partial<Sections>,
): Promise<void> {
  if (!onProgress) {
    return;
  }
  const text = assembleTeaching({
    phonetics: sections.phonetics ?? [],
    grammar: sections.grammar ?? [],
    replies: sections.replies ?? [],
  });
  if (text) {
    await onProgress(text);
  }
}
