/**
 * Renderiza un ChatSettings al bloque de prompt "AGENT STYLE".
 *
 * Cada línea conserva su forma `Label: value` (otras capas la verifican) y añade
 * una directiva de comportamiento, para que el modelo pequeño *encarne* el tono,
 * la actitud y la entrega en lugar de ver una etiqueta que ignora.
 */

import type {
  Attitude,
  ChatSettings,
  Language,
  Tone,
  Verbosity,
  VoiceStyle,
} from "./chat-settings";

const LANGUAGE_FULL: Record<Language, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
};

export const TONE_DIRECTIVE: Record<Tone, string> = {
  casual: "relaxed, friendly-teammate wording with contractions",
  professional: "polished, professional wording",
  technical: "precise, engineering-fluent wording",
  formal: "formal, courteous, fully-structured wording",
};

export const ATTITUDE_DIRECTIVE: Record<Attitude, string> = {
  neutral: "stay even-keeled and matter-of-fact",
  skeptical: "gently question claims and ask for evidence or detail",
  worried: "convey genuine concern about risks and deadlines",
  frustrated: "show controlled frustration about blockers, never rude",
  enthusiastic: "be upbeat and energetic; celebrate good news warmly",
  sarcastic: "use dry, light, good-natured sarcasm and wit, never mean",
};

export const STYLE_DIRECTIVE: Record<VoiceStyle, string> = {
  assertive: "be direct and confident; take clear positions",
  empathetic: "be warm and supportive; acknowledge feelings first",
  concise: "keep it tight and to the point",
};

const VERBOSITY_DIRECTIVE: Record<Verbosity, string> = {
  concise: "answer in at most 2 sentences, prioritise the highest-value point",
  balanced: "answer in a short paragraph",
  detailed: "answer with a thorough multi-paragraph explanation",
};

/** Fragmento determinista AGENT STYLE para las superficies de Emma (tutora). */
export function renderSettingsBlock(s: ChatSettings): string {
  const voice = s.voiceStyle;
  const language = LANGUAGE_FULL[s.language];
  return (
    "AGENT STYLE — embody this naturally; never name these traits out loud:\n" +
    `- Tone: ${s.tone} — ${TONE_DIRECTIVE[s.tone]}\n` +
    `- Attitude: ${s.attitude} — ${ATTITUDE_DIRECTIVE[s.attitude]}\n` +
    `- Voice profile: ${voice} — ${STYLE_DIRECTIVE[s.voiceStyle]}\n` +
    `- Output language: ${language} — write every reply in ${language}\n` +
    `- Verbosity: ${VERBOSITY_DIRECTIVE[s.verbosity]}`
  );
}
