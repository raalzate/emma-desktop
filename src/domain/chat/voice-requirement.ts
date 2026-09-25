/**
 * ¿Este turno se habla o se escribe?
 *
 * El "why": el micrófono era un botón más al lado de enviar, así que hablar era
 * opcional y la práctica se volvía escritura. EMMA es una tutora CONVERSACIONAL:
 * hay momentos donde escribir no sirve —saludar, explicar algo con detalle,
 * cerrar la escena, o volver tras varios turnos sin usar la voz—. La regla vive
 * acá, pura y configurable; la UI sólo obedece.
 *
 * Los avisos van en español (andamiaje, Artículo 9); la conversación sigue solo
 * en inglés.
 */

export type VoiceReason = "greeting" | "detailed_explanation" | "voice_idle" | "closing";

export interface VoiceRequirement {
  reason: VoiceReason;
  /** Por qué este turno es hablado, dicho al aprendiz en español. */
  promptEs: string;
}

export interface VoiceRequirementInput {
  /** Turno que el aprendiz está por decir (el primero de la escena es 1). */
  turn: number;
  /** Presupuesto de turnos de la escena. */
  maxTurns: number;
  /** Último turno en que mandó nota de voz; null si todavía no habló. */
  lastVoiceTurn: number | null;
  /** La directiva del turno pide desarrollar (contar, justificar, explicar). */
  expectsElaboration: boolean;
  /** Turnos sin voz que disparan la regla de inactividad. */
  idleThreshold?: number;
  /**
   * El aprendiz declaró que no puede hablar (salida de emergencia) o el
   * micrófono no está disponible: ningún turno puede exigir voz, o la sesión
   * quedaría bloqueada.
   */
  voiceUnavailable?: boolean;
}

export const DEFAULT_VOICE_IDLE_TURNS = 3;

const PROMPT_ES: Record<VoiceReason, string> = {
  greeting: "Este turno es hablado: saluda con tu voz.",
  detailed_explanation: "Este turno es hablado: explícalo con tus palabras, en voz alta.",
  voice_idle: "Este turno es hablado: llevas varios turnos sin usar la voz.",
  closing: "Este turno es hablado: cierra la conversación hablando.",
};

const of = (reason: VoiceReason): VoiceRequirement => ({ reason, promptEs: PROMPT_ES[reason] });

/**
 * La regla, en orden de prioridad: abrir > cerrar > explicar > romper la
 * inactividad. Devuelve null cuando el turno es normal (texto y voz).
 */
export function requiresVoice(input: VoiceRequirementInput): VoiceRequirement | null {
  const { turn, maxTurns, lastVoiceTurn, expectsElaboration, voiceUnavailable } = input;
  const idleThreshold = input.idleThreshold ?? DEFAULT_VOICE_IDLE_TURNS;
  if (voiceUnavailable) return null;
  if (turn <= 0) return null;
  if (turn === 1) return of("greeting");
  if (maxTurns > 0 && turn >= maxTurns) return of("closing");
  if (expectsElaboration) return of("detailed_explanation");
  // Turnos completados desde la última nota de voz (sin ninguna, desde el inicio).
  const turnsSinceVoice = turn - 1 - (lastVoiceTurn ?? 0);
  if (idleThreshold > 0 && turnsSinceVoice >= idleThreshold) return of("voice_idle");
  return null;
}
