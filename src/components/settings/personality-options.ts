/** Etiquetas visibles para los enums de personalidad (ChatSettings). */

import {
  ATTITUDES, LANGUAGES, TONES, VERBOSITIES, VOICE_STYLES,
} from "@/domain/chat-settings/chat-settings";

export const TONE_LABELS: Record<(typeof TONES)[number], string> = {
  casual: "Casual", professional: "Professional", technical: "Technical", formal: "Formal",
};

export const ATTITUDE_LABELS: Record<(typeof ATTITUDES)[number], string> = {
  neutral: "Neutral", skeptical: "Skeptical", worried: "Worried",
  frustrated: "Frustrated", enthusiastic: "Enthusiastic", sarcastic: "Sarcastic",
};

export const VOICE_STYLE_LABELS: Record<(typeof VOICE_STYLES)[number], string> = {
  assertive: "Assertive", empathetic: "Empathetic", concise: "Concise",
};

export const LANGUAGE_LABELS: Record<(typeof LANGUAGES)[number], string> = {
  en: "English", es: "Spanish", pt: "Portuguese", fr: "French", de: "German",
};

export const VERBOSITY_LABELS: Record<(typeof VERBOSITIES)[number], string> = {
  concise: "Concise", balanced: "Balanced", detailed: "Detailed",
};

/** Descriptor de un campo de personalidad para renderizar un Select genérico. */
export interface PersonalityField {
  key: "tone" | "attitude" | "voiceStyle" | "language" | "verbosity";
  label: string;
  options: readonly string[];
  labels: Record<string, string>;
}

// Sin "Género de voz": Emma es siempre femenina; la voz de los personajes de
// escena la fija cada protopersona (coherencia persona ↔ voz).
export const PERSONALITY_FIELDS: PersonalityField[] = [
  { key: "tone", label: "Tone", options: TONES, labels: TONE_LABELS },
  { key: "attitude", label: "Attitude", options: ATTITUDES, labels: ATTITUDE_LABELS },
  { key: "voiceStyle", label: "Voice style", options: VOICE_STYLES, labels: VOICE_STYLE_LABELS },
  { key: "language", label: "Support language", options: LANGUAGES, labels: LANGUAGE_LABELS },
  { key: "verbosity", label: "Level of detail", options: VERBOSITIES, labels: VERBOSITY_LABELS },
];

/** Campos configurables de una protopersona (su identidad y voz son fijas). */
export const PERSONA_TUNING_FIELDS = [
  { key: "tone", label: "Tone", options: TONES, labels: TONE_LABELS },
  { key: "attitude", label: "Attitude", options: ATTITUDES, labels: ATTITUDE_LABELS },
  { key: "voiceStyle", label: "Voice style", options: VOICE_STYLES, labels: VOICE_STYLE_LABELS },
] as const;
