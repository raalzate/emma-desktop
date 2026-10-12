/**
 * Mapeo de la voz Edge-TTS de una persona a una voz Kokoro del mismo género y
 * acento cercano. `af_heart` es de Emma (voz Edge reservada) y ninguna otra
 * persona la recibe. La elección dentro del grupo es un hash del id Edge, para
 * que sea estable y personas distintas tiendan a voces distintas.
 */

import type { VoiceGender } from "@/domain/chat-settings/chat-settings";

export const EMMA_KOKORO_VOICE = "af_heart";
const EMMA_EDGE_VOICE = "en-US-EmmaNeural";

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

export function kokoroVoiceFor(edgeVoiceId?: string, gender?: VoiceGender): string {
  const feminine = gender !== "masculine";
  if (feminine && (!edgeVoiceId || edgeVoiceId === EMMA_EDGE_VOICE)) return EMMA_KOKORO_VOICE;

  const british = /^en-GB-/i.test(edgeVoiceId ?? "");
  const pool = british
    ? feminine ? POOLS.gbFemale : POOLS.gbMale
    : feminine ? POOLS.usFemale : POOLS.usMale;
  return pool[hash(edgeVoiceId ?? "") % pool.length];
}
