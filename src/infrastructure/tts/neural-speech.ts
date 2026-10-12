/**
 * Cableado real de la cadena Edge ⇒ Kokoro: el breaker vive aquí, a nivel de
 * módulo, así que dura toda la sesión del renderer y lo comparten el karaoke
 * del chat y la voz de fondo del onboarding.
 */

import type { VoiceGender } from "@/domain/chat-settings/chat-settings";
import { kokoroVoiceFor } from "@/domain/tts/kokoro-voice";
import { edgeTtsAvailable, synthesizeEdge } from "./edge-tts";
import { kokoroAvailable, kokoroState, synthesizeKokoro, warmKokoro } from "./kokoro-tts";
import { createEdgeBreaker, synthesizeChain, type Speech } from "./speech-chain";

/** Primera carga: más allá de esto responde Web Speech y el modelo sigue bajando. */
const KOKORO_LOAD_BUDGET_MS = 3000;

const breaker = createEdgeBreaker();

/** ¿Hay alguna voz neuronal (Edge con bridge, o Kokoro local) para intentar? */
export function neuralSpeechAvailable(): boolean {
  return edgeTtsAvailable() || kokoroAvailable();
}

/** Sintetiza con la mejor voz neuronal disponible; rechaza si hay que usar Web Speech. */
export function synthesizeSpeech(text: string, gender?: VoiceGender, voiceId?: string): Promise<Speech> {
  return synthesizeChain({
    edge: { available: edgeTtsAvailable, synthesize: () => synthesizeEdge(text, gender, voiceId) },
    kokoro: {
      available: kokoroAvailable,
      state: kokoroState,
      warm: warmKokoro,
      synthesize: () => synthesizeKokoro(text, kokoroVoiceFor(voiceId, gender)),
    },
    breaker,
    budgetMs: KOKORO_LOAD_BUDGET_MS,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });
}
