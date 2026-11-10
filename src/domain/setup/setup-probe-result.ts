/** Mediciones crudas que devuelve el puerto `ISetupProbe`. Sólo datos, sin IO. */

export type VoiceEngineUsed = "native" | "wasm" | "web-speech" | "none";

export interface VoiceProbe {
  status: "ok" | "error" | "timeout";
  ms?: number;
  engine: VoiceEngineUsed;
  detail?: string;
}

export interface AiProbe {
  status: "ok" | "empty" | "error" | "timeout";
  /** Sólo la inferencia (sin la carga del modelo). */
  ms?: number;
  /** Carga en frío del motor local, medida aparte; informativa, no cuenta como lentitud. */
  loadMs?: number;
  /** El tope se agotó mientras el modelo local aún cargaba. */
  loadingModel?: boolean;
  mode: "local" | "hybrid" | "remote";
  online: boolean;
  readiness: "ok" | "no-model" | "no-remote-key" | "no-bridge";
  device?: { webgpu?: boolean; ramGB?: number; minRamGB: number };
  localModelAvailable: boolean;
  detail?: string;
}

export interface MicProbe {
  status: "granted" | "denied" | "no-device" | "unknown" | "timeout";
  devices: number;
}

export type ProbeName = "voice" | "ai" | "mic";
