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
  ms?: number;
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
