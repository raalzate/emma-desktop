/**
 * Tuning configurable de una protopersona: tono, actitud y estilo de voz.
 *
 * La identidad (nombre, voz, personalidad base) es fija; lo que el usuario
 * ajusta por persona es su ENTREGA. Este bloque alimenta el prompt de la
 * simulación en lugar de los ajustes de Emma (la tutora): la escena es de la
 * protopersona y siempre transcurre en inglés (inmersión).
 */

import {
  ATTITUDES,
  TONES,
  VOICE_STYLES,
  type Attitude,
  type Tone,
  type VoiceStyle,
} from "@/domain/chat-settings/chat-settings";
import {
  ATTITUDE_DIRECTIVE,
  STYLE_DIRECTIVE,
  TONE_DIRECTIVE,
} from "@/domain/chat-settings/settings-renderer";

export interface PersonaTuning {
  tone: Tone;
  attitude: Attitude;
  voiceStyle: VoiceStyle;
}

export const DEFAULT_PERSONA_TUNING: PersonaTuning = {
  tone: "professional",
  attitude: "neutral",
  voiceStyle: "assertive",
};

/** Sanea un objeto arbitrario (persistencia) a un PersonaTuning válido. */
export function normalizePersonaTuning(raw: unknown): PersonaTuning {
  const r = (raw ?? {}) as Record<string, unknown>;
  const pick = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
    options.includes(value as T) ? (value as T) : fallback;
  return {
    tone: pick(r.tone, TONES, DEFAULT_PERSONA_TUNING.tone),
    attitude: pick(r.attitude, ATTITUDES, DEFAULT_PERSONA_TUNING.attitude),
    voiceStyle: pick(r.voiceStyle, VOICE_STYLES, DEFAULT_PERSONA_TUNING.voiceStyle),
  };
}

/** Bloque CHARACTER STYLE del prompt de simulación (la escena SIEMPRE en inglés). */
export function renderCharacterStyle(t: PersonaTuning): string {
  return (
    "CHARACTER STYLE (embody, never name): " +
    `${t.tone} — ${TONE_DIRECTIVE[t.tone]}; ` +
    `${t.attitude} — ${ATTITUDE_DIRECTIVE[t.attitude]}; ` +
    `${t.voiceStyle} — ${STYLE_DIRECTIVE[t.voiceStyle]}.`
  );
}
