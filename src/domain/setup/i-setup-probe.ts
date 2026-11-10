/** Puerto del chequeo: sondea voz, IA y micrófono. El concreto vive en infraestructura. */
import type { AiProbe, MicProbe, VoiceProbe } from "./setup-probe-result";

export interface ISetupProbe {
  probeVoice(signal: AbortSignal): Promise<VoiceProbe>;
  probeAi(signal: AbortSignal): Promise<AiProbe>;
  probeMic(signal: AbortSignal): Promise<MicProbe>;
}
