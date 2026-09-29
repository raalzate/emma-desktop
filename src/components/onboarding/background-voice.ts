/**
 * Voz de Emma en segundo plano para el onboarding: cada mensaje suyo se locuta
 * solo, sin botón de play ni karaoke. Voz principal Edge-TTS (audio real) con
 * caída a Web Speech (SO, offline). Un mensaje nuevo corta al anterior, y una
 * síntesis que llega tarde (de un mensaje ya superado) se descarta para que
 * nunca suenen dos voces a la vez. Las dependencias entran por argumento para
 * poder probar la política sin DOM ni red.
 */

import { hasSpeakableContent, toSpeakable } from "@/domain/tts/speakable-text";

export interface Playable {
  play(): Promise<void>;
  pause(): void;
}

export interface LocalHandle {
  stop(): void;
}

export interface BackgroundVoiceDeps {
  edgeAvailable(): boolean;
  /** Sintetiza con Edge y devuelve la URL del audio. */
  synthesize(text: string): Promise<string>;
  createAudio(url: string): Playable;
  localAvailable(): boolean;
  speakLocal(text: string, onEnd: () => void): LocalHandle;
}

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

  const stop = () => {
    audio?.pause();
    audio = null;
    local?.stop();
    local = null;
  };

  const speakLocal = (text: string) => {
    if (!deps.localAvailable()) return;
    local = deps.speakLocal(text, () => {
      local = null;
    });
  };

  const speak = async (text: string) => {
    stop();
    if (!hasSpeakableContent(text)) return;
    const speakable = toSpeakable(text);
    const mine = ++generation;
    if (!deps.edgeAvailable()) return speakLocal(speakable);
    try {
      const url = await deps.synthesize(speakable);
      if (mine !== generation) return;
      audio = deps.createAudio(url);
      await audio.play();
    } catch {
      if (mine !== generation) return;
      audio = null;
      speakLocal(speakable);
    }
  };

  return { speak, stop };
}
