/** Puerto del chequeo: sondea voz, IA y micrófono. El concreto vive en infraestructura. */
import type { AiProbe, MicProbe, VoiceProbe } from "./setup-probe-result";

/** Avance parcial de la sonda de IA: si se agota el tope, el caso de uso lo conserva. */
export type AiProgress = (partial: Partial<AiProbe>) => void;

export interface ISetupProbe {
  probeVoice(signal: AbortSignal): Promise<VoiceProbe>;
  probeAi(signal: AbortSignal, progress?: AiProgress): Promise<AiProbe>;
  probeMic(signal: AbortSignal): Promise<MicProbe>;
}
