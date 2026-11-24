/**
 * Puerto que sintetiza una frase con la voz de EMMA y devuelve el clip ya
 * comprimido. Lo implementa infraestructura (Kokoro + conversión a Opus).
 */

export interface VoicedPhrase {
  data: Uint8Array;
  durationMs: number;
}

export interface IPhraseVoicer {
  /** Null si la síntesis no estuvo disponible: la práctica sigue sin audio. */
  voice(text: string, voice: string): Promise<VoicedPhrase | null>;
}
