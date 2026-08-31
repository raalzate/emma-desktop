/**
 * Objetos de valor e interfaces del ayudante de inglés ("Teach me").
 *
 * Compartidos por los parsers (que los producen) y el renderer de Markdown (que
 * los formatea). El dominio no conoce React/Electron/IO — solo estas formas.
 */

/** Un turno de la conversación reciente (contexto para las sugerencias). */
export interface ContextTurn {
  role?: string;
  content?: string;
}

/** Fila de la tabla de pronunciación: inglés | respelling español | traducción. */
export interface PronunciationRow {
  word: string;
  /** Respelling al estilo español, p.ej. "today" -> "tudéi". */
  sounds: string;
  /** Traducción al español de la frase. */
  translation: string;
}

/** Una estructura gramatical detectada en el texto (explicada en español). */
export interface GrammarStructure {
  label: string;
  pattern: string;
  example: string;
  explanation: string;
}

/** Una respuesta alternativa sugerida al aprendiz, con nota de registro/tono. */
export interface ReplySuggestion {
  english: string;
  note: string;
}

/** Petición de enseñanza: el texto de Emma más el contexto para explicarlo. */
export interface TeachingRequest {
  text: string;
  responseId: string;
  userId: number;
  explainLanguage: string;
  contextHistory: ContextTurn[];
}

/** Estado del resultado de enseñanza. */
export type TeachingStatus = "success" | "error";
export const TeachingStatus = { SUCCESS: "success", ERROR: "error" } as const;

/** Resultado completo del ayudante: Markdown ensamblado más metadatos. */
export interface TeachingResult {
  originalText: string;
  teachingText: string;
  explainLanguage: string;
  latencyMs: number;
  status: TeachingStatus;
  errorCode: string | null;
  cached: boolean;
  replySuggestions: string[];
  /** Secciones estructuradas para render personalizado (tabla con audio, etc.). */
  sections: {
    phonetics: PronunciationRow[];
    grammar: GrammarStructure[];
    replies: ReplySuggestion[];
  };
}

/**
 * Callback de progreso: recibe el Markdown acumulado tras cada sección para que
 * la UI renderice el ayudante de forma progresiva en vez de bloquear.
 */
export type ProgressCallback = (markdown: string) => Promise<void> | void;
