"use client";

/**
 * Cablea la voz en segundo plano del onboarding a los adaptadores reales
 * (Edge-TTS vía bridge de Electron, Web Speech como caída) y la calla al
 * desmontar la pantalla.
 */

import { useEffect, useMemo } from "react";
import { edgeTtsAvailable, synthesizeEdge } from "@/infrastructure/tts/edge-tts";
import { speak, ttsAvailable } from "@/infrastructure/tts/web-speech-tts";
import { createBackgroundVoice, type BackgroundVoice } from "./background-voice";

export function useBackgroundVoice(): BackgroundVoice {
  const voice = useMemo(
    () =>
      createBackgroundVoice({
        edgeAvailable: edgeTtsAvailable,
        synthesize: async (text) => (await synthesizeEdge(text)).audioUrl,
        createAudio: (url) => new Audio(url),
        localAvailable: ttsAvailable,
        speakLocal: (text, onEnd) => speak(text, { onEnd }),
      }),
    [],
  );
  useEffect(() => () => voice.stop(), [voice]);
  return voice;
}
