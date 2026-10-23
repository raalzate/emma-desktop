/**
 * Voz de Emma en segundo plano para el onboarding: cada mensaje suyo se locuta
 * solo, sin botón de play ni karaoke. Voz principal Kokoro (audio real, local) con
 * caída a Web Speech (SO, offline). Se sintetiza por oración (`planSpeechChunks`):
 * Kokoro en WASM va más lento que el tiempo real y esperar el mensaje entero
 * dejaba segundos de silencio (#267). Un mensaje nuevo corta al anterior, y una
 * síntesis que llega tarde (de un mensaje ya superado) se descarta para que
 * nunca suenen dos voces a la vez. Las dependencias entran por argumento para
 * poder probar la política sin DOM ni red.
 */

import { hasSpeakableContent, toSpeakable } from "@/domain/tts/speakable-text";
import { planSpeechChunks } from "@/domain/tts/speech-chunks";

export interface Playable {
  onended: ((event: Event) => void) | null;
  play(): Promise<void>;
  pause(): void;
}

export interface LocalHandle {
  stop(): void;
}

export interface BackgroundVoiceDeps {
  neuralAvailable(): boolean;
  /** Sintetiza con la voz neuronal y devuelve la URL del audio. */
  synthesize(text: string): Promise<string>;
  createAudio(url: string): Playable;
  localAvailable(): boolean;
  speakLocal(text: string, onEnd: () => void): LocalHandle;
  /** Estado para la UI: sin indicio, la espera de la voz parecía un cuelgue (#269). */
  onState?(state: VoiceState): void;
}

export type VoiceState = "idle" | "preparing" | "speaking";

export interface BackgroundVoice {
  /** Locuta *text*; resuelve cuando el audio arrancó (o se descartó). */
  speak(text: string): Promise<void>;
  stop(): void;
}

export function createBackgroundVoice(deps: BackgroundVoiceDeps): BackgroundVoice {
  let audio: Playable | null = null;
  let local: LocalHandle | null = null;
  // Generación de la última petición: una síntesis con generación vieja se tira.
  let generation = 0;
  let state: VoiceState = "idle";

  const setState = (next: VoiceState) => {
    if (next === state) return;
    state = next;
    deps.onState?.(next);
  };

  const stop = () => {
    generation++;
    if (audio) audio.onended = null;
    audio?.pause();
    audio = null;
    local?.stop();
    local = null;
    setState("idle");
  };

  const speakLocal = (text: string) => {
    if (!deps.localAvailable()) return setState("idle");
    const mine = generation;
    setState("speaking");
    local = deps.speakLocal(text, () => {
      if (mine !== generation) return;
      local = null;
      setState("idle");
    });
  };

  /** Suena el trozo i y, mientras tanto, sintetiza el siguiente (el motor es serial). */
  const playChunk = async (chunks: string[], i: number, url: string, mine: number) => {
    const next = i + 1 < chunks.length ? deps.synthesize(chunks[i + 1]) : null;
    next?.catch(() => undefined); // si el mensaje se corta antes, nadie lo espera
    audio = deps.createAudio(url);
    audio.onended = () => void advance(chunks, i + 1, next, mine);
    await audio.play();
    setState("speaking");
  };

  const advance = async (chunks: string[], i: number, next: Promise<string> | null, mine: number) => {
    if (mine !== generation) return;
    if (!next) return setState("idle");
    try {
      const url = await next;
      if (mine !== generation) return;
      await playChunk(chunks, i, url, mine);
    } catch {
      if (mine !== generation) return;
      audio = null;
      speakLocal(chunks.slice(i).join(" "));
    }
  };

  const speak = async (text: string) => {
    stop();
    if (!hasSpeakableContent(text)) return;
    const speakable = toSpeakable(text);
    const mine = generation;
    if (!deps.neuralAvailable()) return speakLocal(speakable);
    const planned = planSpeechChunks(speakable).map((c) => c.text);
    const chunks = planned.length ? planned : [speakable];
    setState("preparing");
    try {
      const url = await deps.synthesize(chunks[0]);
      if (mine !== generation) return;
      await playChunk(chunks, 0, url, mine);
    } catch {
      if (mine !== generation) return;
      audio = null;
      speakLocal(speakable);
    }
  };

  return { speak, stop };
}
