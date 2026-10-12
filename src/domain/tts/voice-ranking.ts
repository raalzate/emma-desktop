/**
 * Elección de la voz local (Web Speech) cuando la voz neuronal en la nube no
 * responde. La primera voz del idioma suele ser la compacta o una de novedad
 * del SO (macOS trae "Bad News", "Zarvox"…), y suena robótica; aquí se puntúa
 * la calidad antes que el orden en que el SO las lista.
 */

import type { VoiceGender } from "@/domain/chat-settings/chat-settings";

/** Lo mínimo de `SpeechSynthesisVoice` que importa para elegir. */
export interface VoiceInfo {
  name: string;
  lang: string;
}

const NOVELTY =
  /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|pipe organ)\b/i;
const FEMININE = /female|emma|ava|samantha|allison|susan|zoe|victoria|zira|aria|jenny|karen|moira|tessa|serena|kate/i;
const MASCULINE = /\bmale|david|daniel|alex|tom|evan|nathan|guy|aaron|fred|oliver|arthur|reed/i;

function quality(name: string): number {
  if (/premium/i.test(name)) return 3;
  if (/enhanced|natural|neural|online|google/i.test(name)) return 2;
  return 0;
}

function genderFit(name: string, gender?: VoiceGender): number {
  const wants = gender === "masculine" ? MASCULINE : FEMININE;
  return wants.test(name) ? 1 : 0;
}

function score(voice: VoiceInfo, lang: string, gender?: VoiceGender): number {
  const region = voice.lang.replace("_", "-").toLowerCase() === lang.toLowerCase() ? 2 : 0;
  return quality(voice.name) * 10 + region + genderFit(voice.name, gender);
}

/** La voz más natural del idioma de *lang*; undefined si no hay ninguna. */
export function pickNaturalVoice<V extends VoiceInfo>(
  voices: V[],
  lang: string,
  gender?: VoiceGender,
): V | undefined {
  const base = lang.slice(0, 2).toLowerCase();
  const candidates = voices.filter(
    (v) => v.lang.toLowerCase().startsWith(base) && !NOVELTY.test(v.name),
  );
  return candidates.reduce<V | undefined>(
    (best, v) => (!best || score(v, lang, gender) > score(best, lang, gender) ? v : best),
    undefined,
  );
}
