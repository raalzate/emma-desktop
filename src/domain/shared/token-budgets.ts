/**
 * Presupuestos de tokens por tipo de generación de IA (portado de src/config/ai_config.py).
 *
 * EMMA descompone las generaciones complejas en cadenas de llamadas focalizadas;
 * cada paso tiene su propio tope. La ventana total del modelo local se configura
 * en ai-config.ts (LiteRT `maxNumTokens`).
 */

export const LLM_CONTEXT_WINDOW = 8192;
export const LLM_DEFAULT_MAX_TOKENS = 500;

export const CHAT_MAX_TOKENS = 512;
/** Etiqueta del turno del aprendiz (JSON de una línea): LLM juzga, código decide. */
export const OBSERVE_MAX_TOKENS = 80;
export const WELCOME_MAX_TOKENS = 150;
export const COMPREHEND_MAX_TOKENS = 50;
/** Un solo turno de onboarding: mensaje corto + línea DATA final. */
export const ONBOARDING_TURN_MAX_TOKENS = 220;
/** Mini-historia inmersiva de la escena (2-4 frases en español). */
export const SCENE_BRIEFING_MAX_TOKENS = 180;
/** Lección post-sesión de Emma (4-7 frases en español con ejemplos EN). */
export const LESSON_MAX_TOKENS = 380;
export const TEACHING_MAX_TOKENS = 512;
export const GRAMMAR_MAX_TOKENS = 360;
export const REPLIES_MAX_TOKENS = 220;
export const PHONETICS_MAX_TOKENS = 460;
export const TRANSLATION_MAX_TOKENS = 512;

/** Gemma 4 cierra cada turno con <end_of_turn>. */
export const LLM_STOP_TOKENS = ["<end_of_turn>"];
export const LLM_DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";
