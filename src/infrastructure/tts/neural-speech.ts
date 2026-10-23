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

/**
 * La voz de fondo del onboarding no tiene clic de reintento: lo que cae a Web
 * Speech se queda robótico. La carga en frío mide ~4 s en reposo y más con Gemma
 * cargando a la vez (#267), así que espera más antes de rendirse.
 */
export const BACKGROUND_LOAD_BUDGET_MS = 20000;

/** Empieza a cargar Kokoro sin hablar, para que la primera frase lo encuentre listo. */
export function warmNeuralSpeech(): void {
  if (kokoroAvailable()) warmKokoro().catch(() => undefined);
}

/** ¿Hay voz neuronal local (Kokoro) para intentar? */
export function neuralSpeechAvailable(): boolean {
  return kokoroAvailable();
}

/** Sintetiza con Kokoro; rechaza si hay que usar Web Speech. */
export function synthesizeSpeech(
  text: string,
  gender?: VoiceGender,
  voiceId?: string,
  budgetMs = KOKORO_LOAD_BUDGET_MS,
): Promise<Speech> {
  return synthesizeChain({
    kokoro: {
      available: kokoroAvailable,
      state: kokoroState,
      warm: warmKokoro,
      synthesize: () => synthesizeKokoro(text, kokoroVoiceFor(voiceId, gender)),
    },
    budgetMs,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });
}
