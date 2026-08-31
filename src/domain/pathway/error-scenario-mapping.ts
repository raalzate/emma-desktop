/**
 * Mapa estático curado: categoría de error del checker → escenario que la ejercita.
 *
 * Las claves vienen de domain/chat/error-taxonomy; los valores DEBEN ser
 * scenarioTypes que existan en el catálogo, o el boost de recomendación por
 * error nunca se dispara.
 */

export const ERROR_SCENARIO_MAPPING: Record<string, string> = {
  // Narrar ayer/hoy/bloqueos ejercita tiempos verbales y concordancia.
  grammar: "daily_standup",
  word_form: "daily_standup",
  // Las presentaciones personales son densas en artículos ("I am a developer at ...").
  article: "intro_yourself",
  // Fechas, rangos y coberturas ejercitan at/on/from/until.
  preposition: "vacation_request",
  // Hacer preguntas bien formadas fuerza el orden de palabras en inglés.
  word_order: "ask_for_help",
  // Los escenarios escritos exponen hábitos de puntuación/mayúsculas/espaciado.
  punctuation: "slack_status_update",
  capitalization: "slack_status_update",
  spacing: "morning_greeting",
};

/** Devuelve el scenarioType que mejor ejercita *errorType*, si está curado. */
export function scenarioForError(errorType: string | null | undefined): string | null {
  if (errorType === null || errorType === undefined) return null;
  return ERROR_SCENARIO_MAPPING[errorType] ?? null;
}
