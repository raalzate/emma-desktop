/**
 * Cableado real del `IPhraseVoicer`: cadena Kokoro de la app + transcodificador
 * a Opus. Adaptador sin lógica propia (la política vive en
 * `kokoro-phrase-voicer.ts`); se verifica en la app por CDP.
 */

import type { IPhraseVoicer } from "@/domain/audio/i-phrase-voicer";
import { BACKGROUND_LOAD_BUDGET_MS, synthesizeSpeech } from "@/infrastructure/tts/neural-speech";
import { createKokoroPhraseVoicer } from "./kokoro-phrase-voicer";
import { wavToOpus } from "./wav-to-opus";

export function createAppPhraseVoicer(onError?: (error: unknown) => void): IPhraseVoicer {
  return createKokoroPhraseVoicer({
    // Segundo plano: puede esperar la carga del modelo más que un clic.
    synthesize: (text, voice) => synthesizeSpeech(text, "feminine", voice, BACKGROUND_LOAD_BUDGET_MS),
    fetchBlob: async (url) => (await fetch(url)).blob(),
    toOpus: wavToOpus,
    revoke: (url) => URL.revokeObjectURL(url),
    onError,
  });
}
