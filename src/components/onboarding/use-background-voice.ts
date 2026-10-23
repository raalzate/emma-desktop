"use client";

/**
 * Cablea la voz en segundo plano del onboarding a los adaptadores reales
 * (Kokoro local, Web Speech como caída), precalienta Kokoro al montar y la calla
 * al desmontar la pantalla.
 */

import { useEffect, useMemo, useState } from "react";
import {
  BACKGROUND_LOAD_BUDGET_MS,
  neuralSpeechAvailable,
  synthesizeSpeech,
  warmNeuralSpeech,
} from "@/infrastructure/tts/neural-speech";
import { speak, ttsAvailable } from "@/infrastructure/tts/web-speech-tts";
import { createBackgroundVoice, type BackgroundVoice, type VoiceState } from "./background-voice";

export function useBackgroundVoice(): { voice: BackgroundVoice; voiceState: VoiceState } {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const voice = useMemo(
    () =>
      createBackgroundVoice({
        neuralAvailable: neuralSpeechAvailable,
        synthesize: async (text) =>
          (await synthesizeSpeech(text, undefined, undefined, BACKGROUND_LOAD_BUDGET_MS)).audioUrl,
        createAudio: (url) => new Audio(url),
        localAvailable: ttsAvailable,
        speakLocal: (text, onEnd) => speak(text, { onEnd }),
        onState: setVoiceState,
      }),
    [],
  );
  // Precalienta Kokoro al entrar: la primera frase de Emma llega mientras carga.
  useEffect(() => {
    warmNeuralSpeech();
    return () => voice.stop();
  }, [voice]);
  return { voice, voiceState };
}
