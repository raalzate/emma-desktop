/**
 * Muestra de voz de una protopersona: la frase con la que se presenta y la
 * descripción de la voz Kokoro que le toca (voz, acento, género). Dominio puro.
 */

import type { Protopersona, PersonaVoice } from "./protopersona";
import { kokoroVoiceFor } from "@/domain/tts/kokoro-voice";

export type VoiceAccent = "US English" | "British English";

export interface PersonaVoiceDescription {
  kokoroVoice: string;
  accent: VoiceAccent;
  gender: PersonaVoice;
}

export function voiceSampleText(persona: Protopersona): string {
  return `Hi, I'm ${persona.name}, your ${persona.role}. Ready when you are.`;
}

export function describePersonaVoice(persona: Protopersona): PersonaVoiceDescription {
  const kokoroVoice = kokoroVoiceFor(persona.ttsVoice, persona.voice);
  const accent: VoiceAccent = kokoroVoice.startsWith("b") ? "British English" : "US English";
  return { kokoroVoice, accent, gender: persona.voice };
}
