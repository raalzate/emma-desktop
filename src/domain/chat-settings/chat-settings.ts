/** Enums + snapshot inmutable de ajustes de personalidad por turno. */

import { DEFAULT_VOICE_IDLE_TURNS } from "@/domain/chat/voice-requirement";

export const TONES = ["casual", "professional", "technical", "formal"] as const;
export const ATTITUDES = [
  "neutral", "skeptical", "worried", "frustrated", "enthusiastic", "sarcastic",
] as const;
export const VOICE_GENDERS = ["masculine", "feminine", "neutral"] as const;
export const VOICE_STYLES = ["assertive", "empathetic", "concise"] as const;
export const LANGUAGES = ["en", "es", "pt", "fr", "de"] as const;
export const VERBOSITIES = ["concise", "balanced", "detailed"] as const;

export type Tone = (typeof TONES)[number];
export type Attitude = (typeof ATTITUDES)[number];
export type VoiceGender = (typeof VOICE_GENDERS)[number];
export type VoiceStyle = (typeof VOICE_STYLES)[number];
export type Language = (typeof LANGUAGES)[number];
export type Verbosity = (typeof VERBOSITIES)[number];

/**
 * Ajustes de Emma, la TUTORA. Emma es siempre femenina: su voz no se
 * configura (el género de voz de los personajes de escena lo fija cada
 * protopersona). Aquí solo vive su entrega: tono, actitud, estilo, idioma de
 * apoyo y nivel de detalle.
 */
export interface ChatSettings {
  tone: Tone;
  attitude: Attitude;
  voiceStyle: VoiceStyle;
  language: Language;
  verbosity: Verbosity;
  /** Turnos sin nota de voz tras los que el turno pasa a ser hablado (#169). */
  voiceIdleTurns: number;
}

/** Voz fija de Emma en todas sus superficies (onboarding, teach, feedback). */
export const EMMA_VOICE: VoiceGender = "feminine";

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  tone: "professional",
  attitude: "neutral",
  voiceStyle: "empathetic",
  language: "en",
  verbosity: "balanced",
  voiceIdleTurns: DEFAULT_VOICE_IDLE_TURNS,
};

// Un umbral fuera de rango (persistencia vieja, edición a mano) dejaría la
// escena pidiendo voz en cada turno o nunca: se acota en vez de confiar.
const MIN_VOICE_IDLE_TURNS = 1;
const MAX_VOICE_IDLE_TURNS = 10;

const OPTIONS = {
  tone: TONES,
  attitude: ATTITUDES,
  voiceStyle: VOICE_STYLES,
  language: LANGUAGES,
  verbosity: VERBOSITIES,
} as const;

/** Normaliza un objeto arbitrario a ChatSettings válido (sanea persistencia). */
export function normalizeChatSettings(raw: unknown): ChatSettings {
  const r = (raw ?? {}) as Record<string, unknown>;
  // Sólo los campos de enumeración; `voiceIdleTurns` es numérico y se acota aparte.
  const pick = <K extends keyof typeof OPTIONS>(key: K): ChatSettings[K] => {
    const opts = OPTIONS[key] as readonly string[];
    const v = r[key];
    return (opts.includes(v as string) ? (v as ChatSettings[K]) : DEFAULT_CHAT_SETTINGS[key]);
  };
  const idle = Number(r.voiceIdleTurns);
  const voiceIdleTurns = Number.isFinite(idle)
    ? Math.min(MAX_VOICE_IDLE_TURNS, Math.max(MIN_VOICE_IDLE_TURNS, Math.round(idle)))
    : DEFAULT_CHAT_SETTINGS.voiceIdleTurns;
  return {
    voiceIdleTurns,
    tone: pick("tone"),
    attitude: pick("attitude"),
    voiceStyle: pick("voiceStyle"),
    language: pick("language"),
    verbosity: pick("verbosity"),
  };
}
