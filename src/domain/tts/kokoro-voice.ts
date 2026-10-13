/**
 * Mapeo de la clave de voz (`en-US-…Neural`) de una persona a una voz Kokoro del mismo género y
 * acento cercano. `af_heart` es de Emma (clave de voz reservada) y ninguna otra
 * persona la recibe. La elección dentro del grupo es un hash del id de voz, para
 * que sea estable y personas distintas tiendan a voces distintas.
 */

import type { VoiceGender } from "@/domain/chat-settings/chat-settings";

export const EMMA_KOKORO_VOICE = "af_heart";
const EMMA_VOICE_KEY = "en-US-EmmaNeural";

const POOLS = {
  usFemale: ["af_bella", "af_nicole", "af_sarah", "af_sky", "af_nova", "af_river", "af_jessica", "af_kore", "af_alloy", "af_aoede"],
  usMale: ["am_michael", "am_fenrir", "am_puck", "am_echo", "am_eric", "am_liam", "am_onyx", "am_adam"],
  gbFemale: ["bf_emma", "bf_isabella", "bf_alice", "bf_lily"],
  gbMale: ["bm_george", "bm_fable", "bm_lewis", "bm_daniel"],
} as const;

/** Hash djb2 sin signo: estable entre ejecuciones. */
function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h;
}

export function kokoroVoiceFor(voiceId?: string, gender?: VoiceGender): string {
  const feminine = gender !== "masculine";
  if (feminine && (!voiceId || voiceId === EMMA_VOICE_KEY)) return EMMA_KOKORO_VOICE;

  const british = /^en-GB-/i.test(voiceId ?? "");
  const pool = british
    ? feminine ? POOLS.gbFemale : POOLS.gbMale
    : feminine ? POOLS.usFemale : POOLS.usMale;
  return pool[hash(voiceId ?? "") % pool.length];
}
