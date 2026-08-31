/**
 * Metadatos de extracción por paso para el comprehend con LLM
 * (portado de step_extraction_schema.py). `description` y `constraints` se usan
 * VERBATIM dentro del prompt de extracción.
 */

export type ExtractionType = "str" | "int" | "cefr";

export interface StepExtractionSchema {
  step: string;
  expectedType: ExtractionType;
  /** Qué valor extraer (usado tal cual en el prompt del LLM). */
  description: string;
  /** Restricciones adicionales pasadas al LLM. */
  constraints: string;
}

export const STEP_SCHEMAS: Record<string, StepExtractionSchema> = {
  name: {
    step: "name",
    expectedType: "str",
    description: "the person's name",
    constraints: "a single name or full name, no titles or extra words",
  },
  age: {
    step: "age",
    expectedType: "int",
    description: "the person's age in years",
    constraints: "a positive whole number only, no units",
  },
  role: {
    step: "role",
    expectedType: "str",
    description: "the person's professional role or job title",
    constraints: "a short role label such as 'backend developer' or 'DevOps engineer'",
  },
  years_in_role: {
    step: "years_in_role",
    expectedType: "int",
    description: "the number of years the person has worked in their current role",
    constraints: "a positive whole number only, no units",
  },
  tech_stack: {
    step: "tech_stack",
    expectedType: "str",
    description: "the technologies, frameworks, or languages mentioned",
    constraints: "a comma-separated list of technology names, no filler phrases",
  },
  skills: {
    step: "skills",
    expectedType: "str",
    description: "the technical or professional skills mentioned",
    constraints: "a comma-separated list of skills, no filler phrases",
  },
  // El nivel de inglés ya no es un paso del onboarding, pero se conserva el
  // esquema `cefr` para el editor de perfil y cualquier llamador defensivo.
  english_level: {
    step: "english_level",
    expectedType: "cefr",
    description: "the English proficiency level",
    constraints: "one of: A1, A2, B1, B2, C1 — respond with the code only",
  },
};
