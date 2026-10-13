/**
 * Cableado real de la cadena Kokoro: lo comparten el karaoke del chat, la
 * muestra de voz de Protopersonas y la voz de fondo del onboarding.
 */

import type { VoiceGender } from "@/domain/chat-settings/chat-settings";
import { kokoroVoiceFor } from "@/domain/tts/kokoro-voice";
import { kokoroAvailable, kokoroState, synthesizeKokoro, warmKokoro } from "./kokoro-tts";
import { synthesizeChain, type Speech } from "./speech-chain";

/** Primera carga: más allá de esto responde Web Speech y el modelo sigue bajando. */
const KOKORO_LOAD_BUDGET_MS = 3000;

/** ¿Hay voz neuronal local (Kokoro) para intentar? */
export function neuralSpeechAvailable(): boolean {
  return kokoroAvailable();
}

/** Sintetiza con Kokoro; rechaza si hay que usar Web Speech. */
export function synthesizeSpeech(text: string, gender?: VoiceGender, voiceId?: string): Promise<Speech> {
  return synthesizeChain({
    kokoro: {
      available: kokoroAvailable,
      state: kokoroState,
      warm: warmKokoro,
      synthesize: () => synthesizeKokoro(text, kokoroVoiceFor(voiceId, gender)),
    },
    budgetMs: KOKORO_LOAD_BUDGET_MS,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });
}
