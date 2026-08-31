/** Etiquetas en español para los enums de personalidad (ChatSettings). */

import {
  ATTITUDES, LANGUAGES, TONES, VERBOSITIES, VOICE_STYLES,
} from "@/domain/chat-settings/chat-settings";

export const TONE_LABELS: Record<(typeof TONES)[number], string> = {
  casual: "Casual", professional: "Profesional", technical: "Técnico", formal: "Formal",
};

export const ATTITUDE_LABELS: Record<(typeof ATTITUDES)[number], string> = {
  neutral: "Neutral", skeptical: "Escéptica", worried: "Preocupada",
  frustrated: "Frustrada", enthusiastic: "Entusiasta", sarcastic: "Sarcástica",
};

export const VOICE_STYLE_LABELS: Record<(typeof VOICE_STYLES)[number], string> = {
  assertive: "Asertiva", empathetic: "Empática", concise: "Concisa",
};

export const LANGUAGE_LABELS: Record<(typeof LANGUAGES)[number], string> = {
  en: "Inglés", es: "Español", pt: "Portugués", fr: "Francés", de: "Alemán",
};

export const VERBOSITY_LABELS: Record<(typeof VERBOSITIES)[number], string> = {
  concise: "Concisa", balanced: "Equilibrada", detailed: "Detallada",
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
  { key: "tone", label: "Tono", options: TONES, labels: TONE_LABELS },
  { key: "attitude", label: "Actitud", options: ATTITUDES, labels: ATTITUDE_LABELS },
  { key: "voiceStyle", label: "Estilo de voz", options: VOICE_STYLES, labels: VOICE_STYLE_LABELS },
  { key: "language", label: "Idioma de apoyo", options: LANGUAGES, labels: LANGUAGE_LABELS },
  { key: "verbosity", label: "Nivel de detalle", options: VERBOSITIES, labels: VERBOSITY_LABELS },
];

/** Campos configurables de una protopersona (su identidad y voz son fijas). */
export const PERSONA_TUNING_FIELDS = [
  { key: "tone", label: "Tono", options: TONES, labels: TONE_LABELS },
  { key: "attitude", label: "Actitud", options: ATTITUDES, labels: ATTITUDE_LABELS },
  { key: "voiceStyle", label: "Estilo de voz", options: VOICE_STYLES, labels: VOICE_STYLE_LABELS },
] as const;
