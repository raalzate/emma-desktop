/**
 * Adaptador de Edge-TTS en el renderer: pide al proceso main (window.emmaAPI) el
 * mp3 + los timings por palabra y los entrega listos para <audio> y karaoke.
 * Es la voz principal de Emma (igual que el EMMA original); si no hay bridge o
 * falla la red, el llamador cae a Web Speech (SO, offline).
 */

import type { VoiceGender } from "@/domain/chat-settings/chat-settings";
import type { WordTiming } from "@/domain/ai/llm-port";

/** ¿Hay TTS Edge disponible (estamos en la app de escritorio)? */
export function edgeTtsAvailable(): boolean {
  return typeof window !== "undefined" && !!window.emmaAPI?.ttsSynthesize;
}

/** Voz Edge según el género elegido (por defecto la voz Emma). */
export function voiceFor(gender?: VoiceGender): string {
  if (gender === "masculine") return "en-US-GuyNeural";
  return "en-US-EmmaNeural";
}

export interface EdgeSpeech {
  audioUrl: string;
  timings: WordTiming[];
}

/**
 * Sintetiza *text* con Edge-TTS; devuelve un data URL mp3 + timings de palabra.
 * `voiceId` fija una voz concreta (protopersonas); sin él cae a la voz por
 * género (Emma = en-US-EmmaNeural).
 */
export async function synthesizeEdge(
  text: string,
  gender?: VoiceGender,
  voiceId?: string,
): Promise<EdgeSpeech> {
  const api = window.emmaAPI!;
  const r = await api.ttsSynthesize(text, voiceId ?? voiceFor(gender));
  return { audioUrl: `data:${r.mime};base64,${r.audioBase64}`, timings: r.timings };
}
