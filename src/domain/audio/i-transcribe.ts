/**
 * Puerto ASR (reconocimiento de voz). El dominio y la aplicación dependen solo
 * de esta firma; la implementación concreta con Whisper se construye en el
 * renderer (fuera de alcance aquí).
 */

export type Transcribe = (audio: Float32Array | number[]) => Promise<string>;
