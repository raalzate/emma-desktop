"use client";

/**
 * Cablea la voz en segundo plano del onboarding a los adaptadores reales
 * (voz neuronal Edge-TTS ⇒ Kokoro local, Web Speech como caída) y la calla al
 * desmontar la pantalla.
 */

import { useEffect, useMemo } from "react";
import { neuralSpeechAvailable, synthesizeSpeech } from "@/infrastructure/tts/neural-speech";
import { speak, ttsAvailable } from "@/infrastructure/tts/web-speech-tts";
import { createBackgroundVoice, type BackgroundVoice } from "./background-voice";

export function useBackgroundVoice(): BackgroundVoice {
  const voice = useMemo(
    () =>
      createBackgroundVoice({
        edgeAvailable: neuralSpeechAvailable,
        synthesize: async (text) => (await synthesizeSpeech(text)).audioUrl,
        createAudio: (url) => new Audio(url),
        localAvailable: ttsAvailable,
        speakLocal: (text, onEnd) => speak(text, { onEnd }),
      }),
    [],
  );
  useEffect(() => () => voice.stop(), [voice]);
  return voice;
}
