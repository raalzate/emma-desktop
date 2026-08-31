/**
 * Selección de voz TTS a partir del nivel CEFR y el género
 * (portado VERBATIM de voice_config.py). Los identificadores EdgeTTS se
 * preservan tal cual.
 */

const DEFAULT_VOICE = "en-US-EmmaNeural";

export const CEFR_VOICE_MAP: Record<string, string> = {
  A2: "en-US-AriaNeural",
  B1: "en-US-AriaNeural",
  B2: "en-US-JennyNeural",
  C1: "en-US-GuyNeural",
  C2: "en-US-GuyNeural",
};

export const VOICE_BY_GENDER: Record<string, string> = {
  masculine: "en-US-GuyNeural",
  feminine: "en-US-AriaNeural",
  neutral: DEFAULT_VOICE,
};

/** Voz EdgeTTS para el nivel CEFR; cae a la voz por defecto si es desconocido. */
export function getVoiceForLevel(cefrLevel: string | null): string {
  if (cefrLevel === null) return DEFAULT_VOICE;
  return CEFR_VOICE_MAP[cefrLevel] ?? DEFAULT_VOICE;
}

/** Voz EdgeTTS para *gender*, o null si no está mapeado. */
export function getVoiceForGender(gender: string | null): string | null {
  if (gender === null) return null;
  return VOICE_BY_GENDER[gender] ?? null;
}

/** Elige una voz — el género gana sobre el mapeo por CEFR. */
export function resolveVoice(cefrLevel: string | null, gender: string | null): string {
  return getVoiceForGender(gender) ?? getVoiceForLevel(cefrLevel);
}
