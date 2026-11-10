/**
 * Implementa `IPhraseVoicer` con Kokoro: sintetiza la frase (WAV), lo pasa a
 * Opus y suelta la URL temporal. Si la cadena de voz cae a Web Speech
 * (rechaza), no hay clip: Web Speech no produce audio grabable y la tarjeta de
 * texto se crea igual (FR-006). Dependencias inyectadas: sin Kokoro en pruebas.
 */

import type { IPhraseVoicer, VoicedPhrase } from "@/domain/audio/i-phrase-voicer";
import type { Transcoder } from "./wav-to-opus";

export interface PhraseVoicerDeps {
  /** Síntesis neuronal; rechaza si hay que usar Web Speech. */
  synthesize(text: string, voice: string): Promise<{ audioUrl: string }>;
  fetchBlob(url: string): Promise<Blob>;
  toOpus: Transcoder;
  revoke(url: string): void;
  onError?: (error: unknown) => void;
}

export function createKokoroPhraseVoicer(deps: PhraseVoicerDeps): IPhraseVoicer {
  return {
    async voice(text, voice): Promise<VoicedPhrase | null> {
      let audioUrl: string;
      try {
        ({ audioUrl } = await deps.synthesize(text, voice));
      } catch (error) {
        deps.onError?.(error);
        return null;
      }
      try {
        const clip = await deps.toOpus(await deps.fetchBlob(audioUrl));
        return clip.data.byteLength > 0 ? clip : null;
      } catch (error) {
        deps.onError?.(error);
        return null;
      } finally {
        deps.revoke(audioUrl);
      }
    },
  };
}
