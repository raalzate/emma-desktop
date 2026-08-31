/**
 * Puerto de generación de texto (patrón hexagonal). El dominio y los casos de uso
 * dependen SOLO de esta interfaz — nunca del motor concreto (LiteRT-LM local o
 * nube). La implementación se inyecta desde la capa de interfaz vía el router de
 * IA (src/lib/ai/router.ts) que decide local/remoto según la tarea.
 */

export interface LlmGenerateArgs {
  /** Prompt completo y auto-contenido (para proveedores SIN estado, p.ej. nube). */
  prompt: string;
  system?: string;
  maxTokens?: number;
  /** Callback de streaming opcional (token a token). */
  onToken?: (chunk: string) => void;
  /**
   * Continuidad conversacional: mismo sessionId ⇒ el proveedor PUEDE mantener
   * la conversación viva (KV-cache) y enviar solo `turnMessage` tras la primera
   * llamada. Los proveedores sin estado lo ignoran y usan `prompt`.
   */
  sessionId?: string;
  /** Solo el mensaje nuevo del turno (válido únicamente junto a sessionId). */
  turnMessage?: string;
}

/** Genera texto a partir de un prompt. Devuelve la respuesta completa. */
export type LlmGenerate = (args: LlmGenerateArgs) => Promise<string>;

/** Puerto de síntesis de voz (TTS) con timings de palabra para el karaoke. */
export interface WordTiming {
  word: string;
  /** Inicio en segundos dentro del audio. */
  start: number;
  /** Fin en segundos. */
  end: number;
}

export interface TtsResult {
  /** URL/objeto reproducible del audio generado. */
  audioUrl: string;
  timings: WordTiming[];
  text: string;
}
