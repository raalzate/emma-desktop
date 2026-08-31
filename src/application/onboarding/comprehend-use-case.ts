/**
 * Extracción del valor normalizado de un campo del onboarding a partir de una
 * respuesta en lenguaje natural (portado de comprehend_use_case.py).
 *
 * El LLM SOLO se invoca vía el puerto inyectado `LlmGenerate`. La descomposición
 * es deliberada: una llamada corta y focalizada (~50 tokens) por paso.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import { COMPREHEND_MAX_TOKENS } from "@/domain/shared/token-budgets";
import { isCefrLevel, type CefrLevel } from "@/domain/cefr/cefr-ladder";
import { buildSystemPrompt, buildUserPrompt } from "@/domain/onboarding/comprehend-prompts";
import { STEP_SCHEMAS, type ExtractionType } from "@/domain/onboarding/step-extraction-schema";
import { canSkip, SKIP_COMMAND, SKIP_VALUE } from "@/domain/onboarding/onboarding-state";
import type { OnboardingStep } from "@/domain/onboarding/onboarding-state";

export interface ComprehendArgs {
  llm: LlmGenerate;
  step: OnboardingStep;
  rawAnswer: string;
}

export interface ComprehendOutcome {
  value: string | number;
  skipped: boolean;
}

/**
 * Normaliza *rawAnswer* al valor tipado del paso. Soporta el comando "skip":
 * solo `name` es crítico (no se puede saltar); en el resto, "skip" marca el
 * paso como omitido. Ante fallo de extracción cae al texto crudo.
 */
export async function comprehendStep(args: ComprehendArgs): Promise<ComprehendOutcome> {
  const { llm, step, rawAnswer } = args;
  const raw = rawAnswer.trim();
  if (raw.toLowerCase() === SKIP_COMMAND) {
    if (canSkip(step)) return { value: SKIP_VALUE, skipped: true };
    return { value: "", skipped: false }; // paso crítico → el colector re-pregunta
  }
  if (!raw) return { value: "", skipped: false };
  const schema = STEP_SCHEMAS[step];
  if (!schema) return { value: raw, skipped: false };
  const extracted = await runExtraction(llm, schema.expectedType, buildPrompts(schema, raw));
  return { value: extracted ?? raw, skipped: false };
}

function buildPrompts(
  schema: (typeof STEP_SCHEMAS)[string],
  raw: string,
): { system: string; user: string } {
  return { system: buildSystemPrompt(schema), user: buildUserPrompt(schema, raw) };
}

async function runExtraction(
  llm: LlmGenerate,
  expectedType: ExtractionType,
  prompts: { system: string; user: string },
): Promise<string | number | null> {
  try {
    const response = await llm({
      prompt: prompts.user,
      system: prompts.system,
      maxTokens: COMPREHEND_MAX_TOKENS,
    });
    return parseResponse(expectedType, (response ?? "").trim());
  } catch {
    return null; // fallo del LLM → el llamador usará el texto crudo
  }
}

function parseResponse(expectedType: ExtractionType, response: string): string | number | null {
  if (!response) return null;
  if (expectedType === "int") {
    const value = Number(response);
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (expectedType === "cefr") return validateCefrCode(response);
  return response;
}

/** Devuelve el código CEFR normalizado si aparece exactamente uno; si no, null. */
export function validateCefrCode(raw: string): CefrLevel | null {
  const found = raw.toUpperCase().match(/\b(A1|A2|B1|B2|C1)\b/g) ?? [];
  const distinct = [...new Set(found)];
  if (distinct.length !== 1) return null;
  const code = distinct[0];
  return isCefrLevel(code) ? code : null;
}
