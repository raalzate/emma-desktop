/**
 * TTS local vía Web Speech API (`speechSynthesis`) — reemplaza a edge-tts.
 *
 * Corre en el SO del usuario (offline en macOS/Windows). Los eventos `boundary`
 * dan el índice de carácter + tiempo transcurrido, con lo que sincronizamos el
 * resaltado karaoke palabra a palabra sin un archivo de audio intermedio.
 */

import type { VoiceGender } from "@/domain/chat-settings/chat-settings";

export interface KaraokeHandle {
  /** Cancela la locución en curso. */
  stop(): void;
}

export interface SpeakOptions {
  gender?: VoiceGender;
  lang?: string; // BCP-47, p.ej. "en-US"
  rate?: number;
  /** Se dispara al iniciar cada palabra (índice de palabra en el texto). */
  onWord?: (wordIndex: number) => void;
  onEnd?: () => void;
}

/** ¿Hay síntesis de voz disponible en este runtime? */
export function ttsAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Divide el texto en palabras con su offset de carácter (para mapear boundary). */
function wordOffsets(text: string): { index: number; start: number }[] {
  const out: { index: number; start: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    out.push({ index: i++, start: m.index });
  }
  return out;
}

function pickVoice(lang: string, gender?: VoiceGender): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const byLang = voices.filter((v) => v.lang.startsWith(lang.slice(0, 2)));
  if (!byLang.length) return voices[0];
  const wants = gender === "masculine" ? /male|david|daniel|alex/i : /female|emma|samantha|victoria|zira/i;
  return byLang.find((v) => wants.test(v.name)) ?? byLang[0];
}

/** Locuta *text* y dispara `onWord` en cada palabra para el karaoke. */
export function speak(text: string, opts: SpeakOptions = {}): KaraokeHandle {
  if (!ttsAvailable()) {
    opts.onEnd?.();
    return { stop() {} };
  }
  const lang = opts.lang ?? "en-US";
  const words = wordOffsets(text);
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = opts.rate ?? 0.95;
  const voice = pickVoice(lang, opts.gender);
  if (voice) utter.voice = voice;

  let cursor = 0;
  utter.onboundary = (e) => {
    if (e.name && e.name !== "word") return;
    // Avanza hasta la palabra cuyo offset de carácter alcanza el evento.
    while (cursor + 1 < words.length && words[cursor + 1].start <= e.charIndex) cursor++;
    opts.onWord?.(words[cursor]?.index ?? cursor);
  };
  utter.onend = () => opts.onEnd?.();

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
  return { stop: () => window.speechSynthesis.cancel() };
}
