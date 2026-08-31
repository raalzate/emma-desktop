/**
 * Constructores de prompts para la extracción de valores del onboarding
 * (portado VERBATIM de comprehend_prompts.py).
 */

import type { StepExtractionSchema } from "@/domain/onboarding/step-extraction-schema";

const SYSTEM_TEMPLATE =
  "You are a data extraction assistant. " +
  "The user will provide a sentence containing {description}. " +
  "Extract {description} and respond with only that value — " +
  "no explanation, no punctuation, no extra words. " +
  "Constraints: {constraints}.";

const USER_TEMPLATE =
  "Extract {description} from the following response.\n" +
  "Response: {raw}\n" +
  "Output only the extracted value.";

/** Instrucción de sistema para extraer el valor de un paso. */
export function buildSystemPrompt(schema: StepExtractionSchema): string {
  return SYSTEM_TEMPLATE.replaceAll("{description}", schema.description).replace(
    "{constraints}",
    schema.constraints,
  );
}

/** Prompt de usuario poblado con la entrada cruda. */
export function buildUserPrompt(schema: StepExtractionSchema, raw: string): string {
  return USER_TEMPLATE.replace("{description}", schema.description).replace("{raw}", raw);
}
