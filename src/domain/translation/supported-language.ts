/**
 * Catálogo de idiomas destino soportados por la traducción bajo demanda.
 * `code` es el ISO que persiste la preferencia; `label` es el nombre en inglés
 * que se inyecta VERBATIM en el prompt del traductor (el LLM lo espera así).
 */

export interface SupportedLanguage {
  code: string;
  label: string;
}

export const SUPPORTED_LANGUAGES: Record<string, SupportedLanguage> = {
  es: { code: "es", label: "Spanish" },
  fr: { code: "fr", label: "French" },
  de: { code: "de", label: "German" },
  pt: { code: "pt", label: "Portuguese" },
  zh: { code: "zh", label: "Mandarin" },
};

/** True si `code` es un idioma destino soportado. */
export function isSupported(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_LANGUAGES, code);
}
